const babel = require('babel-core');
const borderGrid = require('../index');

describe('babel-plugin-rn-jsx-border-grid test suite', () => {
  it('test no @showGrid', () => {
    const tpl = `
      const Hello = () => <View>
        <Text>hello world</Text>
      </View>
    `;

    const { code } = babel.transform(tpl, {
      plugins: [borderGrid, 'syntax-jsx']
    });

    expect(code).toMatchSnapshot();
  });

  it('test @showGrid and no style', () => {
    const tpl = `
    /*
    @showGrid
    */
    const Hello = () => <View>
      <Text>hello world</Text>
    </View>
  `;

    const { code } = babel.transform(tpl, {
      plugins: [borderGrid, 'syntax-jsx']
    });

    expect(code).toMatchSnapshot();
  });

  it('test @showGriud and has style', () => {
    const tpl = `
    /*
    @showGrid
    */
    const Hello = () => <View style={{flex:1}}>
      <Text style={{color: 'yellow'}}>hello world</Text>
    </View>
  `;

    const { code } = babel.transform(tpl, {
      plugins: [borderGrid, 'syntax-jsx']
    });

    expect(code).toMatchSnapshot();
  });

  it('test @showGriud and has ref style', () => {
    const tpl = `
    /*
    @showGrid
    */
    const Hello = () => <View style={styles.container}>
      <Text style={[styles.text, hasBackground && {backgroundColor: 'yellow'}]}>
        hello world
      </Text>
    </View>
  `;

    const { code } = babel.transform(tpl, {
      plugins: [borderGrid, 'syntax-jsx']
    });

    expect(code).toMatchSnapshot();
  });
});
