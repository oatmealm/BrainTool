var AllNodes = [];

function parseBTFile(fileText) {
    // crearte and recursively walk orga parse tree to create bt model
    const parseTree = orgaparse(fileText);
    for (const orgaNode of parseTree.children) {
        if (orgaNode.type == "section")
            orgaSection(orgaNode, null);
    }
}

function orgaSection(section, parentAppNode) {
    // Section is a Headlines, Paragraphs and contained Sections. Generate BTNode per Headline from Orga nodes
    const node = new BTNode(BTNode.topIndex++, "", parentAppNode ? parentAppNode.id : null);
    const appNode = new BTAppNode(node, "", 0);
    let allText = "";
    for (const orgaChild of section.children) {
        if (orgaChild.type == "headline") {
            appNode.level = orgaChild.level;
            node.title = orgaText(orgaChild, appNode);
            if (orgaChild.keyword) appNode.keyword = orgaChild.keyword;
            appNode.tags = orgaChild.tags;
            appNode.drawers = orgaDrawers(orgaChild);
            if (appNode.drawers.PROPERTIES)
                appNode.folded = appNode.drawers.PROPERTIES.match(/:VISIBILITY:\s*folded/g) ? true : false;
            else
                appNode.folded = false;
        }
        if (orgaChild.type == "paragraph") {
            allText += allText.length ? "\n\n" : "";      // add newlines between para's
            allText += orgaText(orgaChild, appNode);      // returns text but also updates appNode
        }
        if (orgaChild.type == "section") {
            var childAppNode = orgaSection(orgaChild, appNode);
            if (childAppNode.linkChildren) appNode.linkChildren = true;    // determines display state
        }
    }
    appNode.text = allText;
    return appNode;
}

function orgaDrawers(node) {
    // Look for org mode drawer w VISIBILITY property for folded state
    var orgaChild;
    var drawers = {};
    for (var i = 0; i < node.children.length; i++) {
        orgaChild = node.children[i];
        if (orgaChild.type == "drawer" && orgaChild.name && orgaChild.value) {
            drawers[orgaChild.name] = orgaChild.value;
        }
    }
    return drawers;
}

function orgaFolded(node) {
    // Look for org mode drawer w VISIBILITY property for folded state
    var orgaChild;
    for (var i = 0; i < node.children.length; i++) {
        orgaChild = node.children[i];
        if (orgaChild.type == "drawer" && orgaChild.name == "PROPERTIES" && orgaChild.value) {
            if (orgaChild.value.match(/:VISIBILITY:\s*folded/g))
                return true;
        }
    }
    return false;
}

function orgaLinkOrgText(node) {
    return "[[" + node.uri.raw + "][" + node.desc + "]]";
}

function orgaText(orgnode, containingNode) {
    // generate text from orga headline or para node. Both can contain texts and links
    // NB also pulling out any keywords (TODO, DONE etc) for display
    let linkTitle, node, btString = "";
    for (const orgaChild of orgnode.children) {
        if (orgaChild.type == "text") {
            btString += orgaChild.value;
        }
        if (orgaChild.type == "link") {
            linkTitle = orgaLinkOrgText(orgaChild);
            btString += linkTitle;
            containingNode.linkChildren = true;                 // remember so we can determine display state

            if (orgnode.type == "paragraph") {
                // This is a link inside text, not a tag'd link. So special handling w BTLinkNode.
                node = new BTNode(BTNode.topIndex++, linkTitle, containingNode.id);
                new BTLinkNode(node, "", containingNode.level+1);
            }
        }
    }
    return btString;
}

/*

function summarizeText(txtsAry) {
    // generate shorter version when needed
    var lnkLen = txtsAry.reduce(function(acc, cv) { return acc + (cv.desc ? cv.desc.length : 0);}, 0);
    var txtCount = txtsAry.reduce(function(acc, cv) { return acc + (cv.desc ? 0 : 1);}, 0);
    var max = 150;
    var nonLnk = 150 - lnkLen;
    var txtLen = parseInt(nonLnk / txtCount);
    var out = "";
    txtsAry.forEach(function(e) {
        if (e.desc) out += e.txt;       // link
        else {
            if (e.txt.length <= txtLen) out += e.txt;
            else {
                var end = txtLen        // walk up to next space before chopping
                while ((e.txt[end++] !== ' ') && (end < e.txt.length)) {};
                out += e.txt.substring(0,end) + "<span class='elipse'>... </span>";
            }
        }
    });
    return out;
}
*/
