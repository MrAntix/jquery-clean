/*!
HTML Clean for jQuery   
Anthony Johnston
http://www.antix.co.uk    
    
version 1.1.0

$Revision$

requires jQuery http://jquery.com   

Use and distibution http://www.opensource.org/licenses/bsd-license.php
*/
(function($) {
    $.fn.htmlClean = function(options) {
        // iterate and html clean each matched element
        return this.each(function() {
            var $this = $(this);
            if (this.value) {
                this.value = $.htmlClean(this.value, options);
            } else {
                this.innerHTML = $.htmlClean(this.innerHTML, options);
            }
        });
    };

    // clean the passed html
    $.htmlClean = function(html, options) {
        options = $.extend({}, $.htmlClean.defaults, options);

        var tagsRE = /<(\/)?(\w+:)?([\w]+)([^>]*)>/gi;
        var attrsRE = /(\w+)=(".*?"|'.*?'|[^\s>]*?)/gi;

        var tagMatch;
        var root = new Element();
        var stack = [root];
        var container = root;

        if (options.bodyOnly) {
            // check for body tag
            if (tagMatch = /<body[^>]*>((\n|.)*)<\/body>/i.exec(html)) {
                html = tagMatch[1];
            }
        }
        html = html.concat("<xxx>"); // ensure last element/text is found

        while (tagMatch = tagsRE.exec(html)) {
            var tag = new Tag(tagMatch[3], tagMatch[1], tagMatch[4]);

            // add the text
            var text = RegExp.leftContext.substring(lastIndex);
            if (text.length > 0) {
                var child = container.children[container.children.length - 1];
                if (container.children.length > 0
                        && isText(child = container.children[container.children.length - 1])) {
                    // merge text
                    container.children[container.children.length - 1] = child.concat(text);
                } else {
                    container.children.push(text);
                }
            }
            var lastIndex = tagsRE.lastIndex;

            if (tag.isClosing) {
                // find matching container
                if (pop(stack, [tag.name])) {
                    stack.pop();
                    container = stack[stack.length - 1];
                }
            } else {
                // create a new element
                var element = new Element(tag);

                if (!tag.toIgnore) {
                    // add attributes
                    if (tag.allowedAttributes != null) {
                        var attrMatch;
                        while (attrMatch = attrsRE.exec(tag.rawAttributes)) {
                            if (tag.allowedAttributes.length == 0
                                    || $.inArray(attrMatch[1], tag.allowedAttributes) > -1) {
                                element.attributes.push(new Attribute(attrMatch[1], attrMatch[2]));
                            }
                        }
                    }

                    // check container rules
                    var add = true;
                    if (!container.isRoot) {
                        if (container.tag.isInline && !tag.isInline) {
                            add = false;
                        } else if (container.tag.disallowNest && tag.disallowNest
                                && !tag.requiredParent) {
                            add = false;
                        } else if (tag.requiredParent) {
                            if (add = pop(stack, tag.requiredParent)) {
                                container = stack[stack.length - 1];
                            }
                        }
                    }

                    if (add) {
                        container.children.push(element);

                        // set as current container element
                        if (!tag.isSelfClosing
                        && !tag.isNonClosing) {
                            stack.push(element);
                            container = element;
                        }
                    }
                }
            }
        }

        // render doc
        return render(root, options).join("");
    }

    // defaults
    $.htmlClean.defaults = {
        bodyOnly: true,
        removeAttrs: [],
        allowedClasses: [],
        format: false,
        formatIndent: 0,
        // tags to replace, and what to replace with, tag name or regex to match the tag and attributes 
        replace: [
            [["b", "big", /span.*?weight:\s*bold/i], "strong"],
            [["i", /span.*?style:\s*italic/i], "em"],
            [[/span.*?-align:\s*super/i], "sup"],
            [[/span.*?-align:\s*sub/i], "sub"]
        ]
    }

    function applyFormat(element, options, output, indent) {
        if (!element.tag.isInline && output.length > 0) {
            output.push("\n");
            for (i = 0; i < indent; i++) output.push("\t");
        }
    }

    function render(element, options) {
        var output = [], empty = element.attributes.length == 0, indent;
        var openingTag = this.name.concat(element.tag.rawAttributes == undefined ? "" : element.tag.rawAttributes);

        // check for replacements
        for (var rep = 0; rep < options.replace.length; rep++) {
            for (var tag = 0; tag < options.replace[rep][0].length; tag++) {
                var byName = typeof (options.replace[rep][0][tag]) == "string";
                if ((byName && options.replace[rep][0][tag] == element.tag.name)
                        || (!byName && options.replace[rep][0][tag].test(openingTag))) {
                    element.tag.name = options.replace[rep][1];
                    rep = options.replace.length;
                    break;
                }
            }
        }
        if (!element.isRoot) {
            // render opening tag
            output.push("<");
            output.push(element.tag.name);
            $.each(element.attributes, function() {
                if ($.inArray(this.name, options.removeAttrs) == -1) {
                    var m = RegExp(/^(['"]?)(.*?)['"]?$/).exec(this.value);
                    var value = m[2];
                    var valueQuote = m[1];

                    // check for classes allowed
                    if (this.name == "class") {
                        value =
                            $.grep(value.split(" "), function(i) {
                                return $.inArray(i, options.allowedClasses) > -1;
                            })
                            .join(" ");
                        valueQuote = "\"";
                    }

                    if (value != null && value.length > 0) {
                        output.push(" ");
                        output.push(this.name);
                        output.push("=");
                        output.push(valueQuote);
                        output.push(value);
                        output.push(valueQuote);
                    }
                }
            });
        }

        if (element.tag.isSelfClosing) {
            // self closing 
            output.push(" />");
            empty = false;
        } else if (element.tag.isNonClosing) {
            empty = false;
        } else {
            if (!element.isRoot) {
                // close
                output.push(">");
            }

            var indent = options.formatIndent++;

            // render children
            var outputChildren = [];
            for (var i = 0; i < element.children.length; i++) {
                var child = element.children[i];
                var text = $.htmlClean.trim(textClean(isText(child) ? child : child.childrenToString()));
                if (isInline(child)) {
                    if (i > 0 && text.length > 0
                        && (startsWithWhitespace(child) || endsWithWhitespace(element.children[i - 1]))) {
                        outputChildren.push(" ");
                    }
                }
                if (isText(child)) {
                    if (text.length > 0) {
                        outputChildren.push(text);
                    }
                } else {
                    // don't allow a break to be the last child
                    if (i != element.children.length - 1 || child.tag.name != "br") {
                        if (options.format) applyFormat(child, options, outputChildren, indent);
                        outputChildren = outputChildren.concat(render(child, options));
                    }
                }
            }
            options.formatIndent--;

            if (outputChildren.length > 0) {
                if (options.format && outputChildren[0] != "\n") applyFormat(element, options, output, indent);
                output = output.concat(outputChildren);
                empty = false;
            }


            if (!element.isRoot) {
                // render the closing tag
                if (options.format) applyFormat(element, options, output, indent - 1);
                output.push("</");
                output.push(element.tag.name);
                output.push(">");
            }
        }

        // check for empty tags
        if (!element.tag.allowEmpty && empty) { return []; }

        return output;
    }

    // find a matching tag, and pop to it, if not do nothing
    function pop(stack, tagNameArray, index) {
        index = index || 1;
        if ($.inArray(stack[stack.length - index].tag.name, tagNameArray) > -1) {
            return true;
        } else if (stack.length - (index + 1) > 0
                && pop(stack, tagNameArray, index + 1)) {
            stack.pop();
            return true;
        }
        return false;
    }

    // Element Object
    function Element(tag) {
        if (tag) {
            this.tag = tag;
            this.isRoot = false;
        } else {
            this.tag = new Tag("root");
            this.isRoot = true;
        }
        this.attributes = [];
        this.children = [];

        this.childrenToString = function() {
            return this.children.join("");
        }

        return this;
    }

    // Attribute Object
    function Attribute(name, value) {
        this.name = name;
        this.value = value;

        return this;
    }

    // Tag object
    function Tag(name, close, rawAttributes) {
        this.name = name.toLowerCase();

        this.isSelfClosing = $.inArray(this.name, tagSelfClosing) > -1;
        this.isNonClosing = $.inArray(this.name, tagNonClosing) > -1;
        this.isClosing = (close != undefined && close.length > 0);

        this.isInline = $.inArray(this.name, tagInline) > -1;
        this.disallowNest = $.inArray(this.name, tagDisallowNest) > -1;
        this.requiredParent = tagRequiredParent[$.inArray(this.name, tagRequiredParent) + 1];
        this.allowEmpty = $.inArray(this.name, tagAllowEmpty) > -1;

        this.toIgnore = $.inArray(this.name, tagIgnore) > -1;

        this.rawAttributes = rawAttributes;
        this.allowedAttributes = tagAttributes[$.inArray(this.name, tagAttributes) + 1];

        return this;
    }

    function startsWithWhitespace(item) {
        while (isElement(item) && item.children.length > 0) { item = item.children[0] }
        return isText(item) && item.length > 0 && $.htmlClean.isWhitespace(item.charAt(0));
    }
    function endsWithWhitespace(item) {
        while (isElement(item) && item.children.length > 0) { item = item.children[item.children.length - 1] }
        return isText(item) && item.length > 0 && $.htmlClean.isWhitespace(item.charAt(item.length - 1));
    }
    function isText(item) { return item.constructor == String; }
    function isInline(item) { return isText(item) || item.tag.isInline; }
    function isElement(item) { return item.constructor == Element; }
    function textClean(text) {
        return text
            .replace(/&nbsp;|\n/g, " ")
            .replace(/\s\s+/g, " ");
    }

    // trim off white space, doesn't use regex
    $.htmlClean.trim = function(text) {
        return $.htmlClean.trimStart($.htmlClean.trimEnd(text));
    }
    $.htmlClean.trimStart = function(text) {
        return text.substring($.htmlClean.trimStartIndex(text));
    }
    $.htmlClean.trimStartIndex = function(text) {
        for (var start = 0; start < text.length - 1 && $.htmlClean.isWhitespace(text.charAt(start)); start++);
        return start;
    }
    $.htmlClean.trimEnd = function(text) {
        return text.substring(0, $.htmlClean.trimEndIndex(text));
    }
    $.htmlClean.trimEndIndex = function(text) {
        for (var end = text.length - 1; end >= 0 && $.htmlClean.isWhitespace(text.charAt(end)); end--);
        return end + 1;
    }
    // checks a char is white space or not
    $.htmlClean.isWhitespace = function(c) { return $.inArray(c, whitespace) != -1; }

    // tags to be ignored, content will still be output
    var tagIgnore = [
        "basefont", "center", "dir", "font", "frame", "frameset",
        "iframe", "isindex", "menu", "noframes",
        "s", "strike", "u"];
    // tags which are inline
    var tagInline = [
        "a", "abbr", "acronym", "address", "b", "big", "br", "button",
        "caption", "cite", "code", "del", "em", "font",
        "hr", "i", "input", "img", "ins", "label", "legend", "map", "q",
        "samp", "select", "small", "span", "strong", "sub", "sup",
        "tt", "var"];
    var tagDisallowNest = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "th", "td"];
    var tagAllowEmpty = ["th", "td"];
    var tagRequiredParent = [
        null,
        "li", ["ul", "ol"],
        "dt", ["dl"],
        "dd", ["dl"],
        "td", ["tr"],
        "th", ["tr"],
        "tr", ["table", "thead", "tbody", "tfoot"],
        "thead", ["table"],
        "tbody", ["table"],
        "tfoot", ["table"]
        ];
    var tagProtectContents = ["script", "style", "pre", "code"];
    // tags which self close e.g. <br />
    var tagSelfClosing = ["br", "hr", "img", "link", "meta"];
    // tags which do not close
    var tagNonClosing = ["!doctype", "?xml"];
    // attributes allowed on tags
    var tagAttributes = [
            ["class"],  // default, for all tags not mentioned
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
    // white space chars
    var whitespace = [" ", " ", "\t", "\n", "\r", "\f"];

})(jQuery);