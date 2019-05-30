var crypto = require('crypto');
var { addNamed } = require('@babel/helper-module-imports');

function md5(param) {
  return crypto
    .createHash('md5')
    .update(param)
    .digest('hex');
}

module.exports = function(babel) {
  const { types: t } = babel;

  let i = 0;
  let inlineStyle = [];
  let importStyleSheet = null;

  return {
    visitor: {
      Program: {
        exit(path) {
          //如果没有导入StyleSheet
          if (!importStyleSheet) {
            importStyleSheet = addNamed(path, 'StyleSheet', 'react-native', {
              nameHint: 'StyleSheet'
            });
          }

          const mapStyle = t.objectExpression(
            inlineStyle.map(({ styleName, val }) =>
              t.ObjectProperty(t.identifier(styleName), val)
            )
          );

          const style = t.callExpression(
            t.memberExpression(importStyleSheet, t.identifier('create')),
            [mapStyle]
          );

          path.pushContainer(
            'body',
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier('ai'), style)
            ])
          );

          // clean
          i = 0;
          inlineStyle = [];
          importStyleSheet = null;
        }
      },

      ImportDeclaration(path) {
        const { node } = path;
        const spec = node.specifiers.find(
          spec => spec.imported.name === 'StyleSheet'
        );
        if (spec) {
          importStyleSheet = spec.imported;
        }
      },

      JSXAttribute(path) {
        const { node } = path;
        const name = node.name.name;

        // 过滤掉非style属性
        if (name !== 'style') {
          return;
        }

        const value = node.value;

        // 单个对象
        if (t.isObjectExpression(value.expression)) {
          const styleName = 'style' + ++i;
          inlineStyle.push({ styleName, val: value.expression });
          value.expression = t.jSXMemberExpression(
            t.jSXIdentifier('ai'),
            t.jSXIdentifier(styleName)
          );
        }
        // 数组元素
        else if (t.isArrayExpression(value.expression)) {
          value.expression.elements = value.expression.elements.map(elem => {
            if (t.isObjectExpression(elem)) {
              const styleName = 'style' + ++i;
              inlineStyle.push({ styleName, val: elem });
              return t.jSXMemberExpression(
                t.jSXIdentifier('ai'),
                t.jSXIdentifier(styleName)
              );
            }
            return elem;
          });
        }
      }
    }
  };
};
