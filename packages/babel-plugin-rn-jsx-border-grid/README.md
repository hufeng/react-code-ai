## babel-plugin-rn-jsx-border-grid

为了在 react-native 的样式开发过程中显示出来每个元素的边界，方便 debug 样式的位置

## Getting started

```sh
npm install babel-plugin-rn-jsx-border-grid --save-dev
```

## .babelrc

```json
{
  "plugins": ["rx-jsx-border-grid"]
}
```

## demo

```javascript
/**
 * @showGrid (开启开关)
 */

const Hello = () => (
  <View>
    <Text>hello world</Text>
  </View>
);
```

> transform ===>

```javascript
/*
@showGrid
*/
const Hello = () => <View style={{
  borderWidth: 1,
  borderColor: "#FF7F50",
  borderStyle: "dotted"
}}>
      <Text style={{
    borderWidth: 1,
    borderColor: "#FF00FF",
    borderStyle: "dotted"
  }}>hello world</Text>
    </View>;"
```

```javascript
/*
  @showGrid
*/
const Hello = () => (
  <View style={{ flex: 1 }}>
    <Text style={{ color: 'yellow' }}>hello world</Text>
  </View>
);
```

> transfrom ===>

```javascript
/*
@showGrid
*/
const Hello = () => (
  <View
    style={[
      { flex: 1 },
      {
        borderWidth: 1,
        borderColor: '#FF1493',
        borderStyle: 'dotted'
      }
    ]}
  >
    <Text
      style={[
        { color: 'yellow' },
        {
          borderWidth: 1,
          borderColor: '#FF1493',
          borderStyle: 'dotted'
        }
      ]}
    >
      hello world
    </Text>
  </View>
);
```
