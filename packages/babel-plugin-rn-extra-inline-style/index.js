var crypto = require('crypto');
var { addNamed } = require('@babel/helper-module-imports');

function md5(param, offset = 8) {
  return crypto
    .createHash('md5')
    .update(param)
    .digest('hex')
    .substring(0, offset);
}

/**
 * 将样式的ast表达式还原成普通对象
 * @param {*} node
 */
function extraObjectProperty(node) {
  return node.properties.reduce((r, cur) => {
    const key = cur.key.name;
    const val = cur.value.value;
    r[key] = val;
    return r;
  }, {});
}

/**
 * 分离出来那些属性值不是常量属性
 * 返回不是常量属性的对象集合
 *
 * @param {*} t
 * @param {*} expression
 */
function decomposeStyleProps(t, elem) {
  const literal = [];
  const other = [];
  const props = elem.properties;

  for (let prop of props) {
    const value = prop.value;
    if (t.isStringLiteral(value) || t.isNumericLiteral(value)) {
      literal.push(prop);
    } else {
      other.push(prop);
    }
  }

  // 修正当前的properties，只包含常量属性集合的属性
  elem.properties = literal;

  // 返回非常量属性的对象表达式
  return other.length == 0 ? null : t.objectExpression(other);
}

module.exports = function(babel) {
  const { types: t } = babel;

  let inlineStyle = {};
  let importStyleSheet = null;
  let isJSXStyleAttr = false;
  let unNormalLiteralStyle = [];

  return {
    visitor: {
      Program: {
        enter(path) {
          inlineStyle = {};
          importStyleSheet = null;
          isJSXStyleAttr = false;
          unNormalLiteralStyle = [];
        },
        exit(path) {
          //如果没有导入StyleSheet
          if (!importStyleSheet) {
            importStyleSheet = addNamed(path, 'StyleSheet', 'react-native', {
              nameHint: 'StyleSheet'
            });
          }

          // 将样式的数组合并成一个对象表达式
          const mapStyle = t.objectExpression(
            Object.keys(inlineStyle).map(v =>
              t.ObjectProperty(t.identifier(v), inlineStyle[v])
            )
          );

          // 使用StyleSheet.create去wrap当前的mapStyle
          const style = t.callExpression(
            t.memberExpression(importStyleSheet, t.identifier('create')),
            [mapStyle]
          );

          // 添加变量
          path.pushContainer(
            'body',
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier('ai'), style)
            ])
          );
        }
      },

      JSXAttribute: {
        enter(path) {
          const { node } = path;
          if (node.name.name === 'style') {
            isJSXStyleAttr = true;
            unNormalLiteralStyle = [];
          } else {
            isJSXStyleAttr = false;
          }
        },
        exit(path) {
          const { node } = path;
          if (node.name.name !== 'style') {
            return;
          }

          if (unNormalLiteralStyle.length > 0) {
            if (t.isArrayExpression(node.value.expression)) {
              node.value.expression = t.arrayExpression(
                [node.value.expression].concat(unNormalLiteralStyle)
              );
            } else {
              node.value.expression = t.arrayExpression(
                [node.value.expression].concat(unNormalLiteralStyle)
              );
            }
          }

          // clean
          isJSXStyleAttr = false;
          unNormalLiteralStyle = [];
        }
      },

      ImportDeclaration(path) {
        const { node } = path;
        if (node.source.value === 'react-native') {
          const spec = node.specifiers.find(
            spec => spec.imported.name === 'StyleSheet'
          );
          if (spec) {
            importStyleSheet = spec.imported;
          }
        }
      },

      ObjectExpression(path, { opts }) {
        // 如果当前的对象表达式不在JSX的style中直接返回
        if (!isJSXStyleAttr) {
          return;
        }

        const { node } = path;

        // 分解常量属性
        const other = decomposeStyleProps(t, node);

        //extra raw style
        const rawStyle = extraObjectProperty(node);
        // 生成md5的stylename
        const styleName = '_' + md5(JSON.stringify(rawStyle), opts.hash);

        // 如果当前不存在这个key加入进去
        if (!inlineStyle[styleName]) {
          inlineStyle[styleName] = node;
        }

        path.replaceWith(
          t.jSXMemberExpression(
            t.jSXIdentifier('ai'),
            t.jSXIdentifier(styleName)
          )
        );

        if (other) {
          unNormalLiteralStyle.push(other);
        }
      }
    }
  };
};
