### 剖切
剖切效果一定打开 localClippingEnabled
```js
this.renderer.localClippingEnabled = true
```
剖切用六个plane从上下前后左右切模型，实现逻辑 加载模型 -> 根据模型获取boundinBox -> 整理得到外围盒子各个顶点，同时创建plane, 把plane绑定到material -> 根据鼠标交互更新外围盒子顶点和plane