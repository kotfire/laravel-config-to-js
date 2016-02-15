var fs = require('fs'),
    path = require('path'),
    esprima = require('esprima'),
    escodegen = require('escodegen');

function configToJS(data) {
    // Remove php tags and return
    data = data.replace(/\<\?php/g, '').replace(/\?\>/g, '').replace('return ', 'var config = ')

    // Remove functions and scope operators
    data = data.replace(/\w+\(.*\)/g, "'not supported'");
    data = data.replace(/(["\'])((?:(?!\1).)*)(\1\s*=>\s*)(([^\s\n\r]*)::[^\s\n\r]*)/g, '');
    data = data.replace(/([^\s\n\r]*::[^\s\n\r]*)/g, '');

    // Transform to JS syntax
    data = data.replace(/array\(|\[/g, '{').replace(/\)|]/g, '}').replace(/=>/g, ':').replace(/;/g, '').replace(/'/g, '"');

    // Change invalid syntax { {}, {} } for [ {}, {}, ]
    data = data.replace(/\{((?:[\s\n\r]*\{[^\{\}]+\},*[\s\n\r]*)+)\}/g, "[$1]");
    data = data.replace(/\{([^:}]+,?)\}/g, "[$1]");

    // Remove spaces
    data = data.trim();

    return data;
}

function traverse(node, func, parents) {
    if (!parents) {
        parents = [];
    }
    for (var key in node) {
        if (node.hasOwnProperty(key)) {
            var child = node[key];
            if (hasJsVariableAnnotation(child)) {
                func(child, parents);
            } else {
                if (child.value.type === 'ObjectExpression') {
                    var childParents = parents;
                    childParents.push(child.key.value);
                    parents = [];
                    traverse(child.value.properties, func, childParents);
                }
            }
        }
    }
}

function hasJsVariableAnnotation(node) {
    var found = false;
    if (node.leadingComments) {
        node.leadingComments.forEach(function(comment) {
            if (comment.value.match(/@jsVariable/g)) {
                found = true;
                return;
            }
        });
    }
    return found;
}

function merge(a, b, depth) {
    var forever = depth == null;
    for (var p in b) {
        if (b[p] != null && b[p].constructor==Object && (forever || depth > 0)) {
            a[p] = util.mergeDeep(
                a.hasOwnProperty(p) ? a[p] : {},
                b[p],
                forever ? null : depth-1
            );
        } else {
            a[p] = b[p];
        }
    }
    return a;
}

function buildJSConfig(options) {
    var defaultOptions = {
        configDirPath: './config',
        destFilePath: './resources/assets/js/variables.js',
        namespace: 'Config',
    }

    var options = merge(defaultOptions, options, true);

    var jsConfig = {};

    fs.readdirSync(options.configDirPath).forEach(function (file) {
        var content = fs.readFileSync(path.join(options.configDirPath, file), 'utf-8'),
            basename = path.basename(file, '.php'),
            ast = esprima.parse(configToJS(content), {attachComment: true, tolerant: true}),
            body = ast.body[0];

        if (hasJsVariableAnnotation(body)) {
            var declarations = eval(escodegen.generate(body.declarations[0]));
        } else {
            var declarations = {};
            traverse(body.declarations[0].init.properties, function(node, parents) {
                var property = declarations;
                parents.forEach(function (parent) {
                    if (!property.hasOwnProperty(parent)) {
                        property[parent] = {};
                    }
                    property = property[parent];
                });
                if (node.value.type === 'ArrayExpression') {
                    property[node.key.value] = node.value.elements;
                } else {
                    eval('property.' + node.key.value + ' = ' + escodegen.generate(node.value));
                }
            });
        }

        if (Object.keys(declarations).length > 0) {
            jsConfig[basename] = declarations;
            delete jsConfig[basename][basename];

        }

    });

    var configContents = 'var ' + options.namespace + ' = ' + JSON.stringify(jsConfig, null, 4);

    fs.writeFileSync(options.destFilePath, configContents, 'utf8');
}

module.exports = buildJSConfig;