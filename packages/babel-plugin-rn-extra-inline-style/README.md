# babel-plugin-rn-extra-inline-style

## why

在我们开发 react-native 的过程中，常常都是先写内联样式，然后再做样式的抽取

假如这是我们的源码

```javascript
import { StyleSheet } from 'react-native';

const Hello = () => (
  <View style={{ flex: 1, backgroundColor: 'red' }}>
    <Text style={styles.text}>hello world</Text>
    <Text
      style={[
        styles.text,
        {
          color: 'yellow',
          fontSize: 12,
          alignItems: isIOS ? 'center' : 'left'
        },
        isIOS ? { justifyContent: 'center' } : { justifyContent: 'left' }
      ]}
    >
      hello world
    </Text>
    <Text style={[{ color: 'orange' }, isIOS && { fontSize: 20 }]}>hello</Text>
    <Text
      style={[
        { color: 'orange', ...StyleSheet.absoluteFill },
        isIOS && { fontSize: 20 }
      ]}
    >
      hello
    </Text>
  </View>
);
```

> 经过转换 ^\_^ 这就是这个插件的意义

```javascript
import { StyleSheet } from 'react-native';

const Hello = () => (
  <View style={ai._45ed256f3c}>
    <Text style={styles.text}>hello world</Text>
    <Text
      style={[
        styles.text,
        ai._bbb3854cf5,
        isIOS ? ai._2339851f83 : ai._ffd3cc587e,
        { alignItems: isIOS ? 'center' : 'left' }
      ]}
    >
      hello world
    </Text>
    <Text style={[ai._66c87fbea2, isIOS && ai._a89b8060b5]}>hello</Text>
    <Text
      style={[
        ai._66c87fbea2,
        isIOS && ai._a89b8060b5,
        { ...StyleSheet.absoluteFill }
      ]}
    >
      hello
    </Text>
  </View>
);

const ai = StyleSheet.create({
  _45ed256f3c: { flex: 1, backgroundColor: 'red' },
  _bbb3854cf5: { color: 'yellow', fontSize: 12 },
  _2339851f83: { justifyContent: 'center' },
  _ffd3cc587e: { justifyContent: 'left' },
  _66c87fbea2: { color: 'orange' },
  _a89b8060b5: { fontSize: 20 }
});
```

随着 UI 的 component 的 tree 越来越大，就不想再去抽取，很多这样的样式就存在于我们的代码之中，
这样有什么不好，代码的可读性要差一点，一些展示逻辑淹没在这些样式对象之中，另外一个就是写性能不是很好，影响的是序列化。
标准的 react-native 中使用 StyleSheet.create 创建的对象样式。

面对这样的代码，怎么方便的管理呢。
基于 babel 分析 jsx 的 jsxAttributesde 属性对象中的 style，
然后抽取到 const styles = StyleSheet.create ({}) 之中，key 的名字可以根据样式对象来 md5，保证唯一性。

## getting started

```sh
yarn add babel-plugin-rn-extra-inline-style --dev
```

// .babelrc

```json
{
  "env": {
    "production": {
      "plugins": ["rn-extra-inline-style"]
    }
  }
}
```

这样在 babel 编译的时候会自动完成上面的优化

接下来写个 vscode 插件或者 iflux 的命令行工具
