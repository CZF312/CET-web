import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'dev.db')
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 1. Create default teacher
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const teacher = await prisma.teacher.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '张老师',
    },
  })
  console.log(`Created teacher: ${teacher.name} (${teacher.username})`)

  // 2. Create 60 CET-4 core vocabulary words
  const words = [
    { word: 'abandon', phonetic: '/əˈbændən/', meaning: 'v. 放弃；抛弃', example: 'He abandoned his plan to travel abroad due to the pandemic.', level: 1 },
    { word: 'abstract', phonetic: '/ˈæbstrækt/', meaning: 'adj. 抽象的 n. 摘要', example: 'The concept of time is quite abstract for young children.', level: 2 },
    { word: 'academic', phonetic: '/ˌækəˈdemɪk/', meaning: 'adj. 学术的；学院的', example: 'She has a strong academic background in computer science.', level: 1 },
    { word: 'accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'v. 加速；促进', example: 'The company decided to accelerate the development of new products.', level: 2 },
    { word: 'access', phonetic: '/ˈækses/', meaning: 'n. 通道；使用权 v. 存取', example: 'Students have access to the library resources online.', level: 1 },
    { word: 'accomplish', phonetic: '/əˈkɑːmplɪʃ/', meaning: 'v. 完成；实现', example: 'She accomplished all her goals before the deadline.', level: 1 },
    { word: 'accurate', phonetic: '/ˈækjərət/', meaning: 'adj. 精确的；准确的', example: 'The weather forecast was not very accurate this time.', level: 1 },
    { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: 'v. 达到；取得', example: 'Working hard is the key to achieving success.', level: 1 },
    { word: 'acknowledge', phonetic: '/əkˈnɑːlɪdʒ/', meaning: 'v. 承认；致谢', example: 'He acknowledged his mistake and apologized to the team.', level: 2 },
    { word: 'acquire', phonetic: '/əˈkwaɪər/', meaning: 'v. 获得；学到', example: 'She acquired a new skill by taking online courses.', level: 2 },
    { word: 'adapt', phonetic: '/əˈdæpt/', meaning: 'v. 适应；改编', example: 'It takes time to adapt to a new environment.', level: 1 },
    { word: 'adequate', phonetic: '/ˈædɪkwət/', meaning: 'adj. 充分的；适当的', example: 'We need adequate preparation before the exam.', level: 2 },
    { word: 'adjust', phonetic: '/əˈdʒʌst/', meaning: 'v. 调整；适应', example: 'You need to adjust your study plan according to your progress.', level: 1 },
    { word: 'administration', phonetic: '/ədˌmɪnɪˈstreɪʃn/', meaning: 'n. 管理；行政', example: 'The administration decided to invest more in education.', level: 2 },
    { word: 'adopt', phonetic: '/əˈdɑːpt/', meaning: 'v. 采用；收养', example: 'Many companies have adopted flexible working hours.', level: 1 },
    { word: 'advance', phonetic: '/ədˈvæns/', meaning: 'v./n. 前进；进步', example: 'Technology has advanced rapidly in recent years.', level: 1 },
    { word: 'advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'v. 提倡 n. 提倡者', example: 'Many experts advocate for environmental protection.', level: 3 },
    { word: 'affect', phonetic: '/əˈfekt/', meaning: 'v. 影响；感动', example: 'The weather can greatly affect our mood.', level: 1 },
    { word: 'afford', phonetic: '/əˈfɔːrd/', meaning: 'v. 负担得起；提供', example: 'Not everyone can afford to buy a house in this city.', level: 1 },
    { word: 'aggressive', phonetic: '/əˈɡresɪv/', meaning: 'adj. 侵略的；好斗的', example: 'His aggressive behavior made his colleagues uncomfortable.', level: 2 },
    { word: 'allocate', phonetic: '/ˈæləkeɪt/', meaning: 'v. 分配；拨出', example: 'The government allocated funds for disaster relief.', level: 3 },
    { word: 'alter', phonetic: '/ˈɔːltər/', meaning: 'v. 改变；修改', example: 'We need to alter our approach to solve this problem.', level: 2 },
    { word: 'alternative', phonetic: '/ɔːlˈtɜːrnətɪv/', meaning: 'n. 替代品 adj. 替代的', example: 'Is there an alternative solution to this issue?', level: 2 },
    { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', meaning: 'adj. 模糊的；含糊的', example: 'The instructions were ambiguous and confusing.', level: 3 },
    { word: 'analyze', phonetic: '/ˈænəlaɪz/', meaning: 'v. 分析；解析', example: 'Scientists analyze data to draw conclusions.', level: 1 },
    { word: 'annual', phonetic: '/ˈænjuəl/', meaning: 'adj. 每年的 n. 年刊', example: 'The company holds an annual meeting in December.', level: 1 },
    { word: 'anticipate', phonetic: '/ænˈtɪsɪpeɪt/', meaning: 'v. 预期；期望', example: 'We anticipate that sales will increase next quarter.', level: 3 },
    { word: 'apparent', phonetic: '/əˈpærənt/', meaning: 'adj. 明显的；表面上的', example: 'It was apparent that she was not telling the truth.', level: 2 },
    { word: 'appeal', phonetic: '/əˈpiːl/', meaning: 'v./n. 呼吁；上诉；吸引', example: 'The charity made an appeal for donations.', level: 2 },
    { word: 'apply', phonetic: '/əˈplaɪ/', meaning: 'v. 申请；应用', example: 'She decided to apply for the scholarship.', level: 1 },
    { word: 'approach', phonetic: '/əˈproʊtʃ/', meaning: 'v. 接近 n. 方法', example: 'We need a different approach to this problem.', level: 1 },
    { word: 'appropriate', phonetic: '/əˈproʊpriət/', meaning: 'adj. 适当的；恰当的', example: 'Please wear appropriate clothing for the interview.', level: 1 },
    { word: 'approve', phonetic: '/əˈpruːv/', meaning: 'v. 批准；赞成', example: 'The committee approved the new budget proposal.', level: 1 },
    { word: 'arise', phonetic: '/əˈraɪz/', meaning: 'v. 出现；产生；起身', example: 'Problems may arise when implementing a new system.', level: 2 },
    { word: 'arrange', phonetic: '/əˈreɪndʒ/', meaning: 'v. 安排；排列', example: 'I will arrange a meeting for next Monday.', level: 1 },
    { word: 'artificial', phonetic: '/ˌɑːrtɪˈfɪʃl/', meaning: 'adj. 人工的；虚伪的', example: 'Artificial intelligence is changing our daily lives.', level: 2 },
    { word: 'aspect', phonetic: '/ˈæspekt/', meaning: 'n. 方面；外观', example: 'We should consider every aspect of the problem.', level: 2 },
    { word: 'assess', phonetic: '/əˈses/', meaning: 'v. 评估；评定', example: 'Teachers assess students through various methods.', level: 2 },
    { word: 'assign', phonetic: '/əˈsaɪn/', meaning: 'v. 分配；指派', example: 'The teacher assigned homework to the students.', level: 1 },
    { word: 'associate', phonetic: '/əˈsoʊʃieɪt/', meaning: 'v. 联想 n. 同事', example: 'People often associate red with passion and energy.', level: 2 },
    { word: 'assume', phonetic: '/əˈsuːm/', meaning: 'v. 假设；承担', example: 'We should not assume that everyone agrees with us.', level: 1 },
    { word: 'assure', phonetic: '/əˈʃʊr/', meaning: 'v. 保证；使确信', example: 'I assure you that the product is of high quality.', level: 2 },
    { word: 'atmosphere', phonetic: '/ˈætməsfɪr/', meaning: 'n. 大气；气氛', example: 'The atmosphere in the classroom was very tense.', level: 1 },
    { word: 'attach', phonetic: '/əˈtætʃ/', meaning: 'v. 附加；贴上；重视', example: 'Please attach your resume to the email.', level: 1 },
    { word: 'attain', phonetic: '/əˈteɪn/', meaning: 'v. 达到；获得', example: 'She attained the highest score in the class.', level: 2 },
    { word: 'attempt', phonetic: '/əˈtempt/', meaning: 'v./n. 尝试；企图', example: 'He attempted to climb the mountain but failed.', level: 1 },
    { word: 'attribute', phonetic: '/əˈtrɪbjuːt/', meaning: 'v. 归因于 n. 属性', example: 'She attributes her success to hard work.', level: 2 },
    { word: 'authority', phonetic: '/əˈθɔːrəti/', meaning: 'n. 权威；当局', example: 'The local authority has approved the construction plan.', level: 2 },
    { word: 'automatic', phonetic: '/ˌɔːtəˈmætɪk/', meaning: 'adj. 自动的', example: 'The doors in the supermarket are automatic.', level: 1 },
    { word: 'available', phonetic: '/əˈveɪləbl/', meaning: 'adj. 可用的；有空的', example: 'Are there any tickets available for tonight\'s show?', level: 1 },
    { word: 'awkward', phonetic: '/ˈɔːkwərd/', meaning: 'adj. 尴尬的；笨拙的', example: 'There was an awkward silence after his question.', level: 1 },
    { word: 'barrier', phonetic: '/ˈbæriər/', meaning: 'n. 障碍；屏障', example: 'Language can be a barrier to communication.', level: 2 },
    { word: 'beneficial', phonetic: '/ˌbenɪˈfɪʃl/', meaning: 'adj. 有益的；有利的', example: 'Regular exercise is beneficial to your health.', level: 1 },
    { word: 'bond', phonetic: '/bɑːnd/', meaning: 'n. 纽带；债券 v. 结合', example: 'The bond between mother and child is very strong.', level: 2 },
    { word: 'budget', phonetic: '/ˈbʌdʒɪt/', meaning: 'n. 预算 v. 编预算', example: 'We need to carefully manage our budget.', level: 1 },
    { word: 'burden', phonetic: '/ˈbɜːrdn/', meaning: 'n. 负担；重担', example: 'The high cost of living is a heavy burden for many families.', level: 2 },
    { word: 'campaign', phonetic: '/kæmˈpeɪn/', meaning: 'n. 运动；战役', example: 'The government launched a campaign against pollution.', level: 2 },
    { word: 'capable', phonetic: '/ˈkeɪpəbl/', meaning: 'adj. 有能力的', example: 'She is capable of handling complex problems.', level: 1 },
    { word: 'capacity', phonetic: '/kəˈpæsəti/', meaning: 'n. 容量；能力', example: 'The stadium has a capacity of 50,000 people.', level: 2 },
    { word: 'capture', phonetic: '/ˈkæptʃər/', meaning: 'v. 捕获；俘获', example: 'The photographer captured a beautiful sunset.', level: 2 },
    { word: 'category', phonetic: '/ˈkætəɡɔːri/', meaning: 'n. 类别；范畴', example: 'Books are divided into different categories.', level: 1 },
    { word: 'cautious', phonetic: '/ˈkɔːʃəs/', meaning: 'adj. 谨慎的；小心的', example: 'Be cautious when crossing the street.', level: 2 },
    { word: 'challenge', phonetic: '/ˈtʃælɪndʒ/', meaning: 'n./v. 挑战', example: 'Learning a new language is a great challenge.', level: 1 },
  ]

  for (const w of words) {
    await prisma.word.upsert({
      where: { word: w.word },
      update: {},
      create: w,
    })
  }
  console.log(`Created ${words.length} vocabulary words`)

  // 3. Create 10 sample quizzes (2 per type) - clear existing first for idempotency
  await prisma.quizAttempt.deleteMany()
  await prisma.quiz.deleteMany()

  const quizzes = [
    // Vocabulary quizzes
    {
      type: 'vocabulary',
      title: 'CET-4 核心词汇测验 (一)',
      difficulty: 1,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'The word "abandon" most closely means:',
            options: ['A. to give up', 'B. to build', 'C. to create', 'D. to improve'],
            answer: 'A',
          },
          {
            id: 2,
            question: 'Which word means "to evaluate or estimate the nature or ability of"?',
            options: ['A. assume', 'B. assess', 'C. assign', 'D. assure'],
            answer: 'B',
          },
          {
            id: 3,
            question: 'Choose the correct meaning of "accomplish":',
            options: ['A. to destroy', 'B. to finish successfully', 'C. to begin', 'D. to postpone'],
            answer: 'B',
          },
        ],
      }),
    },
    {
      type: 'vocabulary',
      title: 'CET-4 核心词汇测验 (二)',
      difficulty: 2,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'The word "ambiguous" means:',
            options: ['A. very clear', 'B. having more than one possible meaning', 'C. very simple', 'D. extremely difficult'],
            answer: 'B',
          },
          {
            id: 2,
            question: 'Which of the following is the correct definition of "anticipate"?',
            options: ['A. to look back at the past', 'B. to feel disappointed', 'C. to expect or predict', 'D. to avoid something'],
            answer: 'C',
          },
          {
            id: 3,
            question: 'The synonym of "allocate" is:',
            options: ['A. to collect', 'B. to distribute', 'C. to waste', 'D. to hide'],
            answer: 'B',
          },
        ],
      }),
    },
    // Listening quizzes
    {
      type: 'listening',
      title: 'CET-4 听力理解 (一)',
      difficulty: 1,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'What does the speaker mainly talk about?',
            options: ['A. The importance of education', 'B. The history of technology', 'C. The benefits of exercise', 'D. The impact of climate change'],
            answer: 'A',
            transcript: 'Education plays a vital role in shaping our future. It not only provides knowledge but also develops critical thinking skills.',
          },
          {
            id: 2,
            question: 'According to the speaker, what should students do?',
            options: ['A. Focus only on exams', 'B. Develop practical skills', 'C. Avoid extracurricular activities', 'D. Study only at home'],
            answer: 'B',
            transcript: 'Students should not only focus on academic studies but also develop practical skills through internships and social activities.',
          },
        ],
      }),
    },
    {
      type: 'listening',
      title: 'CET-4 听力理解 (二)',
      difficulty: 2,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'What is the main topic of the conversation?',
            options: ['A. Planning a vacation', 'B. Discussing a project deadline', 'C. Choosing a restaurant', 'D. Reviewing a movie'],
            answer: 'B',
            transcript: 'Man: We need to finish the project by Friday. Woman: That\'s quite tight. Let\'s divide the work and meet every morning to check progress.',
          },
          {
            id: 2,
            question: 'What does the woman suggest?',
            options: ['A. Extending the deadline', 'B. Working alone', 'C. Dividing the work and having daily meetings', 'D. Asking for help from others'],
            answer: 'C',
            transcript: 'Woman: That\'s quite tight. Let\'s divide the work and meet every morning to check progress.',
          },
          {
            id: 3,
            question: 'When is the project due?',
            options: ['A. Monday', 'B. Wednesday', 'C. Thursday', 'D. Friday'],
            answer: 'D',
            transcript: 'Man: We need to finish the project by Friday.',
          },
        ],
      }),
    },
    // Reading quizzes
    {
      type: 'reading',
      title: 'CET-4 阅读理解 (一)',
      difficulty: 1,
      content: JSON.stringify({
        passage: 'The Internet has transformed the way we communicate, learn, and do business. In the past, people relied on traditional mail and face-to-face conversations. Today, emails, social media, and video calls have made communication faster and more convenient. However, some experts worry that excessive use of the Internet may lead to social isolation and reduced face-to-face interaction skills.',
        questions: [
          {
            id: 1,
            question: 'According to the passage, what has the Internet changed?',
            options: ['A. Only the way we learn', 'B. The way we communicate, learn, and do business', 'C. Only the way we do business', 'D. Nothing has changed'],
            answer: 'B',
          },
          {
            id: 2,
            question: 'What concern do some experts have?',
            options: ['A. The Internet is too slow', 'B. People use the Internet too little', 'C. Excessive Internet use may cause social isolation', 'D. Traditional mail is better than email'],
            answer: 'C',
          },
        ],
      }),
    },
    {
      type: 'reading',
      title: 'CET-4 阅读理解 (二)',
      difficulty: 2,
      content: JSON.stringify({
        passage: 'Climate change is one of the most pressing issues of our time. Rising global temperatures are causing glaciers to melt, sea levels to rise, and weather patterns to become more extreme. Scientists have warned that if we do not take immediate action to reduce greenhouse gas emissions, the consequences could be catastrophic. Many countries have signed agreements to limit carbon emissions, but implementing these policies remains a significant challenge. Individuals can also contribute by reducing energy consumption, using public transportation, and supporting sustainable practices.',
        questions: [
          {
            id: 1,
            question: 'What is NOT mentioned as an effect of rising global temperatures?',
            options: ['A. Glaciers melting', 'B. Sea levels rising', 'C. More extreme weather', 'D. Increased rainfall in deserts'],
            answer: 'D',
          },
          {
            id: 2,
            question: 'According to the passage, what can individuals do to help?',
            options: ['A. Sign international agreements', 'B. Reduce energy consumption and use public transportation', 'C. Build more factories', 'D. Ignore the problem'],
            answer: 'B',
          },
          {
            id: 3,
            question: 'The word "catastrophic" in the passage most likely means:',
            options: ['A. very good', 'B. slightly annoying', 'C. extremely destructive', 'D. barely noticeable'],
            answer: 'C',
          },
        ],
      }),
    },
    // Writing quizzes
    {
      type: 'writing',
      title: 'CET-4 写作练习 (一)',
      difficulty: 1,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'Write a short paragraph (50-80 words) about the importance of learning English. Include at least three reasons.',
            sampleAnswer: 'Learning English is important for several reasons. First, English is the most widely used language in the world, which makes it easier to communicate with people from different countries. Second, many academic papers and technical documents are written in English, so mastering it helps in academic research. Finally, knowing English can provide more job opportunities in the global market.',
            scoringCriteria: 'Content (40%): Covers at least 3 reasons. Organization (30%): Clear structure with topic sentence. Language (30%): Grammar and vocabulary accuracy.',
          },
          {
            id: 2,
            question: 'Write a letter to your friend inviting them to a party. Include: time, place, and activities.',
            sampleAnswer: 'Dear Tom, I hope this letter finds you well. I am writing to invite you to a party at my house this Saturday evening. The party will start at 7 PM. We will have dinner, play games, and watch a movie. It would be great if you could come. Please let me know if you can make it. Best wishes, Li Ming.',
            scoringCriteria: 'Format (20%): Proper letter format. Content (40%): Includes time, place, and activities. Language (40%): Appropriate tone and grammar.',
          },
        ],
      }),
    },
    {
      type: 'writing',
      title: 'CET-4 写作练习 (二)',
      difficulty: 2,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'Write an essay (120-150 words) on the topic: "Should college students take part-time jobs?" State your opinion and provide supporting arguments.',
            sampleAnswer: 'Nowadays, many college students choose to take part-time jobs. In my opinion, this is beneficial for several reasons. First, working part-time allows students to gain practical experience that cannot be learned in classrooms. They can develop communication skills and learn how to work in a team. Second, earning their own money helps students understand the value of hard work and become more financially responsible. However, students should balance their work and study to ensure that their academic performance is not affected. In conclusion, taking a part-time job can be a valuable experience for college students if managed properly.',
            scoringCriteria: 'Content (40%): Clear opinion with supporting arguments. Organization (30%): Introduction, body, conclusion. Language (30%): Varied sentence structures and appropriate vocabulary.',
          },
        ],
      }),
    },
    // Translation quizzes
    {
      type: 'translation',
      title: 'CET-4 中译英练习 (一)',
      difficulty: 1,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: '随着科技的发展，人们的生活发生了巨大的变化。',
            sampleAnswer: 'With the development of technology, people\'s lives have undergone great changes.',
            keyPoints: ['With the development of technology', 'undergone great changes'],
          },
          {
            id: 2,
            question: '学习外语需要耐心和练习。',
            sampleAnswer: 'Learning a foreign language requires patience and practice.',
            keyPoints: ['requires patience and practice'],
          },
          {
            id: 3,
            question: '我们应该保护环境，减少污染。',
            sampleAnswer: 'We should protect the environment and reduce pollution.',
            keyPoints: ['protect the environment', 'reduce pollution'],
          },
        ],
      }),
    },
    {
      type: 'translation',
      title: 'CET-4 英译中练习 (二)',
      difficulty: 2,
      content: JSON.stringify({
        questions: [
          {
            id: 1,
            question: 'Education is not the filling of a pail, but the lighting of a fire.',
            sampleAnswer: '教育不是注满一桶水，而是点燃一把火。',
            keyPoints: ['不是...而是...', '注满', '点燃'],
          },
          {
            id: 2,
            question: 'The government has taken measures to address the issue of air pollution in major cities.',
            sampleAnswer: '政府已采取措施解决大城市的空气污染问题。',
            keyPoints: ['采取措施', '解决', '空气污染问题'],
          },
        ],
      }),
    },
  ]

  for (const q of quizzes) {
    await prisma.quiz.create({ data: q })
  }
  console.log(`Created ${quizzes.length} sample quizzes`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
