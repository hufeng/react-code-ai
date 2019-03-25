const {
  extract,
  strip,
  parse,
  parseWithComments,
  print
} = require('jest-docblock');

const colors = [
  // yellow
  '#FFFF00',
  // Gold
  '#FFD700',
  //Coral
  '#FF7F50',
  //DeepPink
  '#FF1493',
  //Fushsia
  '#FF00FF',
  //Lime
  '#00FF00'
];

const borderStyle = t => {
  const color = colors[Math.floor(Math.random() * 6)];
  return t.objectExpression([
    t.ObjectProperty(t.identifier('borderWidth'), t.numericLiteral(1)),
    t.ObjectProperty(t.identifier('borderColor'), t.stringLiteral(color)),
    t.ObjectProperty(t.identifier('borderStyle'), t.stringLiteral('dotted'))
  ]);
};

const enableShowGrid = code => {
  const pragmas = parse(code);
  return typeof pragmas['showGrid'] !== 'undefined';
};

module.exports = function(babel) {
  const { types: t } = babel;

  return {
    visitor: {
      JSXOpeningElement(path) {
        const { node } = path;
        //如果没有 @showGrid 的pragma标记直接返回
        if (!enableShowGrid(path.hub.file.code)) {
          return;
        }

        const attr = node.attributes.find(attr => attr.name.name === 'style');

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
