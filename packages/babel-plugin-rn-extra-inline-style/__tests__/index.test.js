const babel = require('babel-core');
const extraInlineStyle = require('../index');

it('extra inline stle without import StyleSheet', () => {
  const tpl = `
    const Hello = () => (
      <View style={{flex: 1, backgroundColor: 'red'}}>
        <Text style={styles.text}>hello world</Text>      
      </View>
    );
  `;

  const { code } = babel.transform(tpl, {
    plugins: [extraInlineStyle, 'syntax-jsx']
  });

  expect(code).toMatchSnapshot();
});

it('extra inline style with import StyleSheet', () => {
  const tpl = `
  import {StyleSheet} from 'react-native';

  const Hello = () => (
    <View style={{flex: 1, backgroundColor: 'red'}}>
      <Text style={styles.text}>hello world</Text>      
    </View>
  );
`;

  const { code } = babel.transform(tpl, {
    plugins: [extraInlineStyle, 'syntax-jsx']
  });

  expect(code).toMatchSnapshot();
});

it('extra inline style with import StyleSheet and multiple style', () => {
  const tpl = `
  import {StyleSheet} from 'react-native';

  const Hello = () => (
    <View style={{flex: 1, backgroundColor: 'red'}}>
      <Text style={styles.text}>hello world</Text>      
      <Text style={[styles.text, {color: 'yellow', fontSize: 12}]}>hello world</Text>      
    </View>
  );
`;

  const { code } = babel.transform(tpl, {
    plugins: [extraInlineStyle, 'syntax-jsx']
  });

  expect(code).toMatchSnapshot();
});
