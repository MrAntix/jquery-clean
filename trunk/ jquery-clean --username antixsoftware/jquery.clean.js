/*
    HTML Clean for $   
    Copyright (c) 2008 Anthony Johnston
    http://www.antix.co.uk    
    
    version 0.9.0
    
    
*/
(function($) {
    $.clean = function(html) {
        var tagsRE = /<(\/)?([\w:]+)([^>]*)>/gi;
        var attrsRE = /(\w+)=(".*"|'.*'|[^\s>]*)/gi;

        var tagMatch, attrMatch;
        var output = [];
        var lastIndex = 0;
        var tag, content;
        var closed = true;

        // check for body tag
        if (tagMatch = /<body[^>]*>((\n|.)*)<\/body>/i.exec(html)) {
            html = tagMatch[1];
        }

        while (tagMatch = tagsRE.exec(html)) {
            tag = new Tag(tagMatch[2]);

            content = RegExp.leftContext.substring(lastIndex);
            output.push($.clean.trim(content));
            lastIndex = tagsRE.lastIndex;

            // preserve whitespace for inline elements
            if (tag.isInline
                    && $.clean.isWhitespace(content.charAt(content.length - 1))) {
                output.push(" ");
            }

            // add tag if not to be removed
            if ($.inArray(tag.name, tagRemove) == -1) {
                output.push("<");
                output.push(tagMatch[1]);
                output.push(tag.name);

                // add attributes
                if (tag.attributes != null) {
                    while (attrMatch = attrsRE.exec(tagMatch[3])) {
                        if ((tag.attributes.length == 0
                                || $.inArray(attrMatch[1], tag.attributes) > -1)
                                && $.inArray(attrMatch[1], tagAttributesRemove) == -1) {
                            output.push(" ");
                            output.push(attrMatch[1]);
                            output.push("=");
                            output.push(attrMatch[2]);
                        }
                    }
                }

                closed = tagMatch[1] != undefined && tagMatch[1].length > 0;
                if (tag.isSelfClosing) {
                    output.push(" /");
                    closed = true;
                }
                if (tag.isNonClosing) {
                    closed = true;
                }
                output.push(">");
            }
        }

        // final cleanse of ms word and repeated whitespace/newlines
        return output.join('')
            .replace(/\s*(<!(--)?\[if\s+(\n|.)*?<!\[endif\]\2>)/gi, "")
            .replace(/<\/?(\w+:\w+)>/gi, "")
            .replace(/<(\w+)>(&nbsp;|\s)*<\/\1+>/gi, "")
            .replace(/<(\w+)>(&nbsp;|\s)*<\/\1+>/gi, "")
            .replace(/\s\s/gi, " ")
            .replace(/\s\s/gi, " ")
            .replace(/\n\n/gi, "\n")
            .replace(/\n\n/gi, "\n");            
    }

    $.clean.trim = function(text) {
        for (var start = 0; start < text.length && $.clean.isWhitespace(text.charAt(start)); start++);
        for (var end = text.length - 1; end >= 0 && $.clean.isWhitespace(text.charAt(end)); end--);
        return text.substr(start, end + 1);
    }
    $.clean.isWhitespace = function(c) { return $.inArray(c, whitespace) != -1; }

    var tagRemove = [
        "basefont", "center", "dir", "font", "frame", "frameset",
        "iframe", "isindex", "menu", "noframes",
        "s", "span", "strike", "u"];
    var tagReplace = ["b", "big", "i"];
    var tagReplaceWith = ["strong", "strong", "em"];
    var tagInline = [
        "a", "abbr", "acronym", "address", "big", "br", "button",
        "caption", "cite", "code", "del", "em", "font",
        "hr", "input", "img", "ins", "label", "legend", "map", "q",
        "samp", "select", "small", "span", "strong", "sub", "sup",
        "tt", "var"];
    var tagSelfClosing = ["br", "hr", "img", "link", "meta"];
    var tagNonClosing = ["!doctype", "?xml"];
    var tagAttributesRemove = ["class"];
    var tagAttributes = [
            ["class"],
            "?xml", [],
            "!doctype", [],
            "a", ["accesskey", "class", "href", "name", "title", "rel", "rev", "type", "tabindex"],
            "abbr", ["class", "title"],
            "acronym", ["class", "title"],
            "blockquote", ["cite", "class"],
            "button", ["class", "disabled", "name", "type", "value"],
            "del", ["cite", "class", "datetime"],
            "form", ["accept", "action", "class", "enctype", "method", "name"],
            "input", ["accept", "accesskey", "alt", "checked", "class", "disabled", "ismap", "maxlength", "name", "size", "readonly", "src", "tabindex", "type", "usemap", "value"],
            "img", ["alt", "class", "height", "src", "width"],
            "ins", ["cite", "class", "datetime"],
            "label", ["accesskey", "class", "for"],
            "legend", ["accesskey", "class"],
            "link", ["href", "rel", "type"],
            "meta", ["content", "http-equiv", "name", "scheme"],
            "map", ["name"],
            "optgroup", ["class", "disabled", "label"],
            "option", ["class", "disabled", "label", "selected", "value"],
            "q", ["class", "cite"],
            "script", ["src", "type"],
            "select", ["class", "disabled", "multiple", "name", "size", "tabindex"],
            "style", ["type"],
            "table", ["class", "summary"],
            "textarea", ["accesskey", "class", "cols", "disabled", "name", "readonly", "rows", "tabindex"]
        ];
    var whitespace = [" ", " ", "\t", "\n", "\r", "\f"];

    function Tag(name) {
        name = name.toLowerCase();
        var i = $.inArray(name, tagReplace);
        this.name = i == -1 ? name : tagReplaceWith[i];
        this.isInline = $.inArray(this.name, tagInline) > -1;
        this.isSelfClosing = $.inArray(this.name, tagSelfClosing) > -1;
        this.isNonClosing = $.inArray(this.name, tagNonClosing) > -1;
        this.attributes = tagAttributes[$.inArray(this.name, tagAttributes) + 1];

        return this;
    }
})(jQuery);