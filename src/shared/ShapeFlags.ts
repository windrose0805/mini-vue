// 使用位运算处理类型
export enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 2, // 0100
  TEXT_CHILDREN = 1 << 3, // 1000
  ARRAY_CHILDREN = 1 << 4, // 0001 0000
  SLOTS_CHILDREN = 1 << 5 // 0010 0000
}
