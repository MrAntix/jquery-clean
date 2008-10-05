/*
    HTML Clean for $   
    Anthony Johnston
    http://www.antix.co.uk    
    
    version 0.9.3

    Use and distibution http://www.gnu.org/licenses/gpl.html
    requires jQuery http://jquery.com   
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
        options = jQuery.extend($.htmlClean.defaults, options);

        var tagsRE = /<(\/)?(\w+:)?([\w]+)([^>]*)>/gi;
        var attrsRE = /(\w+)=(".*"|'.*'|[^\s>]*)/gi;

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

        while (tagMatch = tagsRE.exec(html)) {
            var tag = new Tag(tagMatch[3], tagMatch[1], tagMatch[4]);

            // add the text
            var text = RegExp.leftContext.substring(lastIndex);
            if (text.length > 0) {
                var child = container.children[container.children.length - 1];
                if (container.children.length > 0
                        && isText(child = container.children[container.children.length - 1])) {
                    // merge text
                    container.children[container.children.length - 1] = textClean(child.concat(text));
                } else {
                    container.children.push(textClean(text));
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
                            if ((tag.allowedAttributes.length == 0
                                    || $.inArray(attrMatch[1], tag.allowedAttributes) > -1)
                                    && $.inArray(attrMatch[1], options.removeAttrs) == -1) {
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
        return render(root).join("");
    }

    // defaults
    $.htmlClean.defaults = {
        bodyOnly: true,
        removeAttrs: ["class"]
    }

    function render(element) {
        var output = [];
        var empty = element.attributes.length == 0;

        // check for replace
        for (var i = 0; i < tagReplace.length; i++) {
            if (tagReplace[i][0] == element.tag.name) {
                if (tagReplace[i].length == 1
                        || tagReplace[i][1].test(element.tag.rawAttributes)) {
                    element.tag.name = tagReplaceWith[i];
                }
            }
        }

        if (!element.isRoot) {
            // render opening tag
            output.push("<");
            output.push(element.tag.name);
            $.each(element.attributes, function() {
                output.push(" ");
                output.push(this.name);
                output.push("=");
                output.push(this.value);
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

            // render children
            var outputChildren = [];
            for (var i = 0; i < element.children.length; i++) {
                var child = element.children[i];
                if (isText(child)) {
                    var text = "";
                    if ((i == 0 ? isInline(element) : isInline(element.children[i - 1]))
                            && $.htmlClean.isWhitespace(child.charAt(0))) {
                        text = text.concat(" ");
                    }
                    text = text.concat($.htmlClean.trim(child));
                    if ((i == element.children.length - 1 ? isInline(element) : isInline(element.children[i + 1]))
                            && $.htmlClean.isWhitespace(child.charAt(child.length - 1))) {
                        text = text.concat(" ");
                    }
                    if (text.length > 0) { outputChildren.push(text); }
                    // don't allow a break to be the last child
                } else if (i != element.children.length - 1 || child.tag.name != "br") {
                    outputChildren = outputChildren.concat(render(child));
                }
            }
            if (outputChildren.length > 0) {
                output = output.concat(outputChildren);
                empty = false;
            }

            if (!element.isRoot) {
                // render the closing tag
                output.push("</");
                output.push(element.tag.name);
                output.push(">");

                //                if (!element.tag.isInline) {
                //                    output.push("\n");
                //                }
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

    function isText(item) { return item.constructor == String; }
    function isInline(item) { return isText(item) || item.tag.isInline; }
    function textClean(text) {
        return text
            .replace(/&nbsp;|\n/g, " ")
            .replace(/\s\s+/g, " ");
    }


    // trim of white space, doesn't use regex
    $.htmlClean.trim = function(text) {
        for (var start = 0; start < text.length - 1 && $.htmlClean.isWhitespace(text.charAt(start)); start++);
        for (var end = text.length - 1; end >= start && $.htmlClean.isWhitespace(text.charAt(end)); end--);
        return text.substring(start, end + 1);
    }
    // checks a char is white space or not
    $.htmlClean.isWhitespace = function(c) { return $.inArray(c, whitespace) != -1; }

    // tags to be ignored, content will still be output
    var tagIgnore = [
        "basefont", "center", "dir", "font", "frame", "frameset",
        "iframe", "isindex", "menu", "noframes",
        "s", "strike", "u"];
    // tags to replace, and what to replace with at the same index
    // [[<Tag Name>,<Pattern Match on Attributes], ...]
    var tagReplace = [["b"], ["big"], ["span", /weight:\s*bold/i], ["i"], ["span", /style:\s*italic/i]];
    var tagReplaceWith = ["strong", "strong", "strong", "em", "em"];
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