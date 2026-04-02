const skills = [
  {
    index: "01",
    title: "嵌入式开发",
    description: "STM32、8051、外设驱动与板级调试，聚焦底层链路稳定性与可维护性。"
  },
  {
    index: "02",
    title: "机器视觉",
    description: "OpenCV、YOLO 与目标检测落地，面向实际识别、检测与数据处理场景。"
  },
  {
    index: "03",
    title: "三维设计",
    description: "建模、结构表达与工程可视化，把设计表达与制造约束结合起来。"
  },
  {
    index: "04",
    title: "全栈实现",
    description: "Python、C/C++、JavaScript 跨栈协作，用统一接口打通网站前后台。"
  }
];

export function HomeSkillGrid() {
  return (
    <div className="skills-grid">
      {skills.map((skill) => (
        <article key={skill.title} className="skill-card">
          <span className="skill-index">{skill.index}</span>
          <h3 className="skill-title">{skill.title}</h3>
          <p className="skill-description">{skill.description}</p>
        </article>
      ))}
    </div>
  );
}
