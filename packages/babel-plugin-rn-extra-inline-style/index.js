var crypto = require('crypto');
var { addNamed } = require('@babel/helper-module-imports');

function md5(param, offset = 8) {
  return crypto
    .createHash('md5')
    .update(param)
    .digest('hex')
    .substring(0, offset);
}

function extraObjectProperty(objectProperties) {
  return objectProperties.reduce((r, cur) => {
    const key = cur.key.name;
    const val = cur.value.value;
    r[key] = val;
    return r;
  }, {});
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

      JSXAttribute(path, { opts }) {
        const { node } = path;
        const name = node.name.name;

        // 过滤掉非style属性
        if (name !== 'style') {
          return;
        }

        const value = node.value;

        // 单个对象
        if (t.isObjectExpression(value.expression)) {
          const rawStyle = extraObjectProperty(value.expression.properties);
          const styleName = '_' + md5(JSON.stringify(rawStyle), opts.hash);

          // 如果当前不存在这个key加入进去
          if (!inlineStyle[styleName]) {
            inlineStyle.push({ styleName, val: value.expression });
          }

          value.expression = t.jSXMemberExpression(
            t.jSXIdentifier('ai'),
            t.jSXIdentifier(styleName)
          );
        }
        // 数组元素
        else if (t.isArrayExpression(value.expression)) {
          value.expression.elements = value.expression.elements.map(elem => {
            if (t.isObjectExpression(elem)) {
              const rawStyle = extraObjectProperty(elem.properties);
              const styleName = '_' + md5(JSON.stringify(rawStyle), opts.hash);

              // 如果当前不存在这个key加入进去
              if (!inlineStyle[styleName]) {
                inlineStyle.push({ styleName, val: elem });
              }

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
