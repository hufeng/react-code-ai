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
 * @param {*} objectProperties
 */
function extraObjectProperty(objectProperties) {
  return objectProperties.reduce((r, cur) => {
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
function decomposeLiteralStyleProps(t, elem) {
  const literal = [];
  const other = [];
  const objectProperties = elem.properties;

  for (let prop of objectProperties) {
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

          // 将样式的数组合并成一个对象表达式
          const mapStyle = t.objectExpression(
            inlineStyle.map(({ styleName, val }) =>
              t.ObjectProperty(t.identifier(styleName), val)
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

          // clean variable
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
          // 分解常量属性
          const other = decomposeLiteralStyleProps(t, value.expression);

          // 生成md5的stylename
          const rawStyle = extraObjectProperty(value.expression.properties);
          const styleName = '_' + md5(JSON.stringify(rawStyle), opts.hash);

          // 如果当前不存在这个key加入进去
          if (!inlineStyle[styleName]) {
            inlineStyle.push({ styleName, val: value.expression });
          }

          if (other) {
            value.expression = t.arrayExpression([
              t.jSXMemberExpression(
                t.jSXIdentifier('ai'),
                t.jSXIdentifier(styleName)
              ),
              other
            ]);
          } else {
            value.expression = t.jSXMemberExpression(
              t.jSXIdentifier('ai'),
              t.jSXIdentifier(styleName)
            );
          }
        }
        // 数组元素
        else if (t.isArrayExpression(value.expression)) {
          const elemes = [];
          value.expression.elements.forEach(elem => {
            if (t.isObjectExpression(elem)) {
              const other = decomposeLiteralStyleProps(t, elem);
              const rawStyle = extraObjectProperty(elem.properties);
              const styleName = '_' + md5(JSON.stringify(rawStyle), opts.hash);

              // 如果当前不存在这个key加入进去
              if (!inlineStyle[styleName]) {
                inlineStyle.push({ styleName, val: elem });
              }

              elemes.push(
                t.jSXMemberExpression(
                  t.jSXIdentifier('ai'),
                  t.jSXIdentifier(styleName)
                )
              );

              if (other) {
                elemes.push(other);
              }
            } else {
              elemes.push(elem);
            }
          });
          value.expression.elements = elemes;
        }
      }
    }
  };
};
