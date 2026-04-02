const defaultThemes = {
  current_theme: 'terminal',
  themes: {
    terminal: {
      name: '命令行终端',
      description: '以终端输出方式展示个人信息与技能。',
      config: {
        username: 'liueggy',
        hostname: 'cdut-dev',
        welcomeText: '欢迎访问 LiuEggy 的个人空间',
        infoLines: ['姓名: LiuEggy', '学校: 成都理工大学'],
        skills: [
          { label: '方向', value: '嵌入式开发' },
          { label: '能力', value: '机器视觉 / 三维设计' }
        ]
      }
    },
    minimal: {
      name: '极简大字',
      description: '突出姓名与方向，适合做更强的个人品牌展示。',
      config: {
        mainName: 'LiuEggy',
        skills: '嵌入式 · 视觉 · 设计',
        school: '成都理工大学',
        gradientColors: ['#4a9eff', '#764ba2']
      }
    },
    gradient: {
      name: '渐变卡片',
      description: '用卡片展示多个方向，结构清晰。',
      config: {
        mainTitle: 'LiuEggy',
        subtitle: '成都理工大学 · 机械工程系',
        cards: [
          { icon: '💻', label: '嵌入式开发', detail: 'STM32 · RTOS' },
          { icon: '👁', label: '机器视觉', detail: 'OpenCV · YOLO' },
          { icon: '🎨', label: '三维设计', detail: 'SolidWorks' },
          { icon: '📍', label: '位置', detail: '成都 · 四川' }
        ]
      }
    },
    typewriter: {
      name: '打字机',
      description: '强调节奏感与动态展示。',
      config: {
        title: 'LiuEggy',
        subtitle: '嵌入式开发 · 机器视觉 · 三维设计',
        typingTexts: ['欢迎来到我的个人网站', '记录实践、项目与思考']
      }
    },
    classic: {
      name: '经典布局',
      description: '稳妥的主视觉布局，适合默认展示。',
      config: {
        title: 'LiuEggy',
        subtitle: '成都理工大学机械工程系学生',
        description: '专注于嵌入式开发、机器视觉和三维设计。'
      }
    }
  }
};

module.exports = {
  defaultThemes
};
