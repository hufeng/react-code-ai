const { parse } = require('jest-docblock');

const colors = [
  '#FFFF00',
  '#FFD700',
  '#FF7F50',
  '#FF1493',
  '#FF00FF',
  '#00FF00',
  '#CC6633',
  '#00FF33',
  '#33FFCC',
  '#9900FF',
  '#CC0099'
];

const borderStyle = t => {
  const color = colors[Math.floor(Math.random() * 6)];
  return t.objectExpression([
    t.ObjectProperty(t.identifier('borderWidth'), t.numericLiteral(1)),
    t.ObjectProperty(t.identifier('borderColor'), t.stringLiteral(color)),
    t.ObjectProperty(t.identifier('borderStyle'), t.stringLiteral('dotted'))
  ]);
};

const parseShowGrid = code => {
  const pragmas = parse(code);
  const showGrid = pragmas['showGrid'];

  return {
    noShowGrid: typeof showGrid === 'undefined',
    recMode: showGrid === 'rec'
  };
};

module.exports = function(babel) {
  const { types: t } = babel;
  let pragmas = {};

  return {
    visitor: {
      Program(path) {
        pragmas = parseShowGrid(path.hub.file.code);
      },
      JSXOpeningElement(path) {
        const { node } = path;
        //如果没有 @showGrid 的pragma标记直接返回
        if (pragmas.noShowGrid) {
          return;
        }

        // fixed: 当jsx使用spread object属性的时候，没有name
        // <Text {...props}></Text>
        const attr = node.attributes.find(
          attr => attr.name && attr.name.name === 'style'
        );

        if (attr) {
          if (t.isArrayExpression(attr.value.expression)) {
            attr.value.expression.elements.push(borderStyle(t));
          } else {
            attr.value.expression = t.arrayExpression([
              attr.value.expression,
              borderStyle(t)
            ]);
          }
        } else {
          node.attributes.push(
            t.JSXAttribute(
              t.JSXIdentifier('style'),
              t.JSXExpressionContainer(borderStyle(t))
            )
          );
        }
      }
    }
  };
};
