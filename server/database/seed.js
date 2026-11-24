const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('--- Đang khởi tạo dữ liệu mẫu thực tế cho hệ thống HSK... ---');

  // 1. Roles
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)');
  insertRole.run('admin', 'Quản trị viên toàn quyền hệ thống');
  insertRole.run('teacher', 'Giáo viên phụ trách lớp và nội dung');
  insertRole.run('student', 'Học viên tham gia học và thi');

  // 2. Users (Admin, Teacher, Student)
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const teacherPass = bcrypt.hashSync('teacher123', salt);
  const studentPass = bcrypt.hashSync('student123', salt);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password_hash, full_name, email, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const existingAdmin = db.prepare('SELECT id, status, role FROM users WHERE username = ?').get('admin');
  if (existingAdmin) {
    if (existingAdmin.status !== 'active' || existingAdmin.role !== 'admin') {
      db.prepare('UPDATE users SET status = "active", role = "admin", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(existingAdmin.id);
      console.log('[SEED] Đã khôi phục trạng thái active và role admin cho tài khoản Quản trị viên chính.');
    }
  } else {
    insertUser.run('admin', adminPass, 'Quản Trị Viên Hệ Thống', 'admin@hskmaster.edu.vn', 'admin', 'active');
    console.log('[SEED] Đã khởi tạo tài khoản Quản trị viên chính (admin / admin123).');
  }

  insertUser.run('giaovien_lan', teacherPass, 'Cô Nguyễn Thị Lan', 'lan.nguyen@hskmaster.edu.vn', 'teacher', 'active');
  insertUser.run('hocsinh_minh', studentPass, 'Trần Quang Minh', 'minh.tq@student.hskmaster.edu.vn', 'student', 'active');
  insertUser.run('hocsinh_mai', studentPass, 'Lê Tuyết Mai', 'mai.lt@student.hskmaster.edu.vn', 'student', 'active');
  insertUser.run('hocsinh_khoa', studentPass, 'Phạm Anh Khoa (Đã Khóa)', 'khoa.pa@student.hskmaster.edu.vn', 'student', 'locked');

  // 3. Vocabulary (HSK 1 -> HSK 6)
  const vocabCount = db.prepare('SELECT count(*) as count FROM vocabulary').get();
  if (vocabCount.count === 0) {
    const insertVocab = db.prepare(`
      INSERT INTO vocabulary (hanzi, pinyin, vietnamese_meaning, hsk_level, category, example_cn, example_pinyin, example_vi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleVocab = [
      // HSK 1
      ['你好', 'nǐ hǎo', 'Xin chào', 1, 'Chào hỏi', '你好，很高兴认识你。', 'Nǐ hǎo, hěn gāoxìng rènshí nǐ.', 'Xin chào, rất vui được làm quen với bạn.'],
      ['谢谢', 'xièxie', 'Cảm ơn', 1, 'Giao tiếp', '太谢谢你的帮助了！', 'Tài xièxie nǐ de bāngzhù le!', 'Rất cảm ơn sự giúp đỡ của bạn!'],
      ['再见', 'zàijiàn', 'Tạm biệt', 1, 'Chào hỏi', '明天见，再见！', 'Míngtiān jiàn, zàijiàn!', 'Hẹn gặp lại ngày mai, tạm biệt!'],
      ['中国', 'Zhōngguó', 'Trung Quốc', 1, 'Địa danh', '我想去中国留学。', 'Wǒ xiǎng qù Zhōngguó liúxué.', 'Tôi muốn đi du học Trung Quốc.'],
      ['学习', 'xuéxí', 'Học tập', 1, 'Hành động', '我们在学习汉语。', 'Wǒmen zài xuéxí Hànyǔ.', 'Chúng tôi đang học tiếng Hán.'],
      ['老师', 'lǎoshī', 'Giáo viên', 1, 'Nghề nghiệp', '王老师是我们的汉语老师。', 'Wáng lǎoshī shì wǒmen de Hànyǔ lǎoshī.', 'Thầy Vương là giáo viên tiếng Hán của chúng tôi.'],
      ['喜欢', 'xǐhuan', 'Thích', 1, 'Cảm xúc', '我很喜欢喝中国茶。', 'Wǒ hěn xǐhuan hē Zhōngguó chá.', 'Tôi rất thích uống trà Trung Quốc.'],
      ['苹果', 'píngguǒ', 'Quả táo', 1, 'Hoa quả', '你想吃苹果吗？', 'Nǐ xiǎng chī píngguǒ ma?', 'Bạn có muốn ăn táo không?'],
      
      // HSK 2
      ['考试', 'kǎoshì', 'Kỳ thi, thi cử', 2, 'Học tập', '下个星期我们有汉语考试。', 'Xià gè xīngqī wǒmen yǒu Hànyǔ kǎoshì.', 'Tuần tới chúng tôi có kỳ thi tiếng Hán.'],
      ['帮助', 'bāngzhù', 'Giúp đỡ', 2, 'Hành động', '非常感谢你的热情帮助。', 'Fēicháng gǎnxiè nǐ de rèqíng bāngzhù.', 'Vô cùng cảm ơn sự giúp đỡ nhiệt tình của bạn.'],
      ['运动', 'yùndòng', 'Vận động, thể thao', 2, 'Đời sống', '多做运动对身体很好。', 'Duō zuò yùndòng duì shēntǐ hěn hǎo.', 'Tập thể dục nhiều rất tốt cho sức khỏe.'],
      ['便宜', 'piányi', 'Rẻ (giá cả)', 2, 'Mua sắm', '这件衣服不仅好看而且很便宜。', 'Zhè jiàn yīfu bùjǐn hǎokàn érqiě hěn piányi.', 'Bộ quần áo này không những đẹp mà còn rất rẻ.'],
      ['旅游', 'lǚyóu', 'Đi du lịch', 2, 'Đời sống', '今年夏天我们打算去北京旅游。', 'Jīnnián xiàtiān wǒmen dǎsuàn qù Běijīng lǚyóu.', 'Mùa hè năm nay chúng tôi dự định đi du lịch Bắc Kinh.'],
      ['机场', 'jīchǎng', 'Sân bay', 2, 'Giao thông', '我正在开车去机场接朋友。', 'Wǒ zhèngzài kāichē qù jīchǎng jiē péngyou.', 'Tôi đang lái xe ra sân bay đón bạn.'],

      // HSK 3
      ['环境', 'huánjìng', 'Môi trường', 3, 'Xã hội', '保护环境是每个人的责任。', 'Bǎohù huánjìng shì měi gè rén de zérèn.', 'Bảo vệ môi trường là trách nhiệm của mỗi người.'],
      ['解决', 'jiějué', 'Giải quyết', 3, 'Hành động', '我们一定能找到解决办法。', 'Wǒmen yídìng néng zhǎodào jiějué bànfǎ.', 'Chúng ta nhất định có thể tìm ra cách giải quyết.'],
      ['水平', 'shuǐpíng', 'Trình độ', 3, 'Học tập', '经过努力，他的听力水平提高得很快。', 'Jīngguò nǔlì, tā de tīnglì shuǐpíng tígāo de hěn kuài.', 'Qua nỗ lực, trình độ nghe của anh ấy tiến bộ rất nhanh.'],
      ['参加', 'cānjiā', 'Tham gia', 3, 'Hành động', '我想参加下个月的HSK三级考试。', 'Wǒ xiǎng cānjiā xià gè yuè de HSK sān jí kǎoshì.', 'Tôi muốn tham gia kỳ thi HSK 3 vào tháng tới.'],

      // HSK 4
      ['坚持', 'jiānchí', 'Kiên trì', 4, 'Phẩm chất', '只要坚持每天练习，你就会成功。', 'Zhǐyào jiānchí měitiān liànxí, nǐ jiù huì chénggōng.', 'Chỉ cần kiên trì luyện tập mỗi ngày, bạn sẽ thành công.'],
      ['交流', 'jiāoliú', 'Giao lưu, trao đổi', 4, 'Xã hội', '语言是人与人交流的重要工具。', 'Yǔyán shì rén yǔ rén jiāoliú de zhòngyào gōngjù.', 'Ngôn ngữ là công cụ quan trọng để con người giao lưu.'],
      ['丰富', 'fēngfù', 'Phong phú', 4, 'Tính từ', '这本书的内容非常丰富。', 'Zhè běn shū de nèiróng fēicháng fēngfù.', 'Nội dung cuốn sách này vô cùng phong phú.'],

      // HSK 5
      ['挑战', 'tiǎozhàn', 'Thử thách', 5, 'Trừu tượng', '面对生活中的挑战，我们要勇敢前行。', 'Miànduì shēnghuó zhōng de tiǎozhàn, wǒmen yào yǒnggǎn qiánxíng.', 'Đối mặt với thử thách trong cuộc sống, chúng ta phải dũng cảm tiến bước.'],
      ['深刻', 'shēnkè', 'Sâu sắc', 5, 'Tính từ', '这次旅行给我留下了深刻的印象。', 'Zhè cì lǚxíng gěi wǒ liú xià le shēnkè de yìnxiàng.', 'Chuyến du lịch lần này đã để lại cho tôi ấn tượng sâu sắc.'],

      // HSK 6
      ['精益求精', 'jīng yì qiú jīng', 'Đã tinh thông lại muốn tinh thông hơn', 6, 'Thành ngữ', '他在工作中总是精益求精，追求卓越。', 'Tā zài gōngzuò zhōng zǒngshì jīng yì qiú jīng, zhuīqiú zhuóyuè.', 'Anh ấy trong công việc luôn luôn tinh tế tỉ mỉ, theo đuổi sự xuất sắc.']
    ];

    for (const v of sampleVocab) {
      insertVocab.run(...v);
    }
  }

  // 4. Grammar Points
  const grammarCount = db.prepare('SELECT count(*) as count FROM grammar').get();
  if (grammarCount.count === 0) {
    const insertGrammar = db.prepare(`
      INSERT INTO grammar (title, structure, explanation, hsk_level, example_cn, example_pinyin, example_vi, practice_questions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleGrammar = [
      [
        'Cấu trúc nhấn mạnh 是...的 (Shì...de)',
        'Chủ ngữ + 是 + [Thời gian / Địa điểm / Phương thức] + Động từ + 的',
        'Dùng để nhấn mạnh thời gian, địa điểm, cách thức hoặc người thực hiện của một hành động đã diễn ra trong quá khứ.',
        1,
        '我是昨天坐飞机来北京的。',
        'Wǒ shì zuótiān zuò fēijī lái Běijīng de.',
        'Tôi đến Bắc Kinh bằng máy bay vào ngày hôm qua (nhấn mạnh thời gian và phương tiện).',
        JSON.stringify([
          {
            question: 'Điền từ thích hợp: 他____2020年来中国的。',
            options: ['在', '是', '有', '会'],
            answer: '是',
            explanation: 'Cấu trúc nhấn mạnh thời gian hành động đã hoàn thành: 是...的'
          }
        ])
      ],
      [
        'Câu chữ 把 (Bǎ) cơ bản',
        'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác',
        'Dùng để biểu thị hành động tác động lên đối tượng cụ thể và làm thay đổi vị trí, trạng thái của đối tượng đó.',
        3,
        '请你把窗户关上。',
        'Qǐng nǐ bǎ chuānghu guān shàng.',
        'Xin bạn hãy đóng cửa sổ lại.',
        JSON.stringify([
          {
            question: 'Sắp xếp câu chữ 把: 喝光了 / 把 / 他 / 水',
            options: ['他把水喝光了', '把水他喝光了', '水把他喝光了', '他喝光了把水'],
            answer: '他把水喝光了',
            explanation: 'Trật tự: Chủ ngữ (他) + 把 + Tân ngữ (水) + Động từ kết quả (喝光了)'
          }
        ])
      ],
      [
        'Liên từ 不但...而且... (Búdàn... érqiě...)',
        'Chủ ngữ + 不但 + Vế 1 + 而且 + Vế 2',
        'Biểu thị quan hệ tăng tiến: Không những... mà còn...',
        2,
        '中国菜不但好吃，而且很有特色。',
        'Zhōngguó cài búdàn hǎochī, érqiě hěn yǒu tèsè.',
        'Món ăn Trung Quốc không những ngon mà còn rất đặc sắc.',
        JSON.stringify([
          {
            question: 'Chọn liên từ thích hợp: 她____会说英语，____会说汉语。',
            options: ['因为...所以...', '虽然...但是...', '不但...而且...', '如果...就...'],
            answer: '不但...而且...',
            explanation: 'Quan hệ bổ sung tăng cấp khả năng ngôn ngữ: Không những... mà còn...'
          }
        ])
      ],
      [
        'Phó từ 越来越... (Yuè lái yuè...)',
        'Chủ ngữ + 越来越 + Tính từ / Động từ tâm lý',
        'Biểu thị sự phát triển, tăng dần theo thời gian: Càng ngày càng...',
        2,
        '天气越来越冷了。',
        'Tiānqì yuè lái yuè lěng le.',
        'Thời tiết càng ngày càng lạnh rồi.',
        JSON.stringify([
          {
            question: 'Câu nào diễn đạt đúng: "Tiếng Trung của anh ấy ngày càng giỏi"?',
            options: ['他的汉语越来越好。', '他的汉语好越来越。', '越来越他的汉语好。', '他越来越汉语好。'],
            answer: '他的汉语越来越好。',
            explanation: 'Cấu trúc: 越来越 + Tính từ'
          }
        ])
      ]
    ];

    for (const g of sampleGrammar) {
      insertGrammar.run(...g);
    }
  }

  // 5. Listening Materials
  const listeningCount = db.prepare('SELECT count(*) as count FROM listening_materials').get();
  if (listeningCount.count === 0) {
    const insertListening = db.prepare(`
      INSERT INTO listening_materials (title, hsk_level, audio_url, dialog_script, pinyin_script, vietnamese_translation, questions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertListening.run(
      'Hội thoại mua sắm tại siêu thị',
      1,
      '',
      '男：你好，这个苹果多少钱一斤？\n女：三块钱一斤，很甜很新鲜。\n男：好的，给我来三斤。',
      'Nán: Nǐ hǎo, zhè ge píngguǒ duōshao qián yì jīn?\nNǚ: Sān kuài qián yì jīn, hěn tián hěn xīnxiān.\nNán: Hǎo de, gěi wǒ lái sān jīn.',
      'Nam: Xin chào, táo này bao nhiêu tiền một cân?\nNữ: Ba tệ một cân, rất ngọt và tươi.\nNam: Được, cho tôi 3 cân.',
      JSON.stringify([
        {
          id: 1,
          question: '苹果多少钱一斤？(Táo bao nhiêu tiền một cân?)',
          options: ['两块 (2 tệ)', '三块 (3 tệ)', '四块 (4 tệ)', '五块 (5 tệ)'],
          answer: '三块 (3 tệ)',
          explanation: 'Cô gái trả lời rõ ràng: 三块钱一斤 (3 tệ một cân).'
        },
        {
          id: 2,
          question: '男的买了多少斤苹果？(Người nam mua bao nhiêu cân táo?)',
          options: ['一斤', '两斤', '三斤', '四斤'],
          answer: '三斤',
          explanation: 'Người nam nói: "好的，给我来三斤" (Cho tôi 3 cân).'
        }
      ])
    );

    insertListening.run(
      'Kế hoạch cuối tuần tại Thư viện',
      2,
      '',
      '女：周末你打算做什么？\n男：我想去图书馆看书，下周有汉语考试。\n女：我们一起去吧，我也需要复习。',
      'Nǚ: Zhōumò nǐ dǎsuàn zuò shénme?\nNán: Wǒ xiǎng qù túshūguǎn kàn shū, xià zhōu yǒu Hànyǔ kǎoshì.\nNǚ: Wǒmen yìqǐ qù ba, wǒ yě xūyào fùxí.',
      'Nữ: Cuối tuần bạn dự định làm gì?\nNam: Tôi muốn đến thư viện đọc sách, tuần sau có kỳ thi tiếng Hán.\nNữ: Chúng ta cùng đi nhé, tôi cũng cần ôn tập.',
      JSON.stringify([
        {
          id: 1,
          question: '男的周末打算去哪里？(Người nam cuối tuần định đi đâu?)',
          options: ['机场 (Sân bay)', '图书馆 (Thư viện)', '超市 (Siêu thị)', '公园 (Công viên)'],
          answer: '图书馆 (Thư viện)',
          explanation: 'Người nam nói: "我想去图书馆看书" (Tôi muốn đến thư viện đọc sách).'
        }
      ])
    );
  }

  // 6. Reading Materials
  const readingCount = db.prepare('SELECT count(*) as count FROM reading_materials').get();
  if (readingCount.count <= 1) {
    const insertReading = db.prepare(`
      INSERT INTO reading_materials (title, hsk_level, passage_cn, pinyin, vietnamese_translation, questions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertReading.run(
      'Giới thiệu bạn học và trường học (HSK 1)',
      1,
      '你好！我叫王朋，我是中国人。我在北京的一所大学学习。我的大学很大，也很漂亮。我有一个好朋友叫李明，我们每天一起去上学。',
      'Nǐ hǎo! Wǒ jiào Wáng Péng, wǒ shì Zhōngguó rén. Wǒ zài Běijīng de yì suǒ dàxué xuéxí. Wǒ de dàxué hěn dà, yě hěn piàoliang. Wǒ yǒu yí gè hǎo péngyou jiào Lǐ Míng, wǒmen měitiān yìqǐ qù shàngxué.',
      'Xin chào! Tôi tên là Vương Bằng, tôi là người Trung Quốc. Tôi học ở một trường đại học tại Bắc Kinh. Trường đại học của tôi rất lớn và cũng rất đẹp. Tôi có một người bạn thân tên là Lý Minh, chúng tôi mỗi ngày đều cùng nhau đi học.',
      JSON.stringify([
        {
          id: 1,
          question: '王朋是哪国人？(Vương Bằng là người nước nào?)',
          options: ['中国人 (Người Trung Quốc)', '美国人 (Người Mỹ)', '英国人 (Người Anh)', '日本人 (Người Nhật)'],
          answer: '中国人 (Người Trung Quốc)',
          explanation: 'Đoạn văn có câu: 我是中国人。'
        },
        {
          id: 2,
          question: '王朋的好朋友叫什么名字？(Bạn thân của Vương Bằng tên gì?)',
          options: ['大卫', '李明', '王老师', '张丽'],
          answer: '李明',
          explanation: 'Đoạn văn có câu: 我有一个好朋友叫李明。'
        }
      ])
    );

    insertReading.run(
      'Cuộc sống học tập của du học sinh David tại Bắc Kinh',
      2,
      '大卫是一个美国留学生，他在北京语言大学学习汉语。他每天早上七点起床，八点去上课。他的老师王老师教得非常好，同学们也都很友好。除了学习，大卫还很喜欢打篮球和中国书法。他觉得学中文虽然不容易，但是非常有意思。',
      'Dàwèi shì yí gè Měiguó liúxuéshēng, tā zài Běijīng Yǔyán Dàxué xuéxí Hànyǔ. Tā měitiān zǎoshang qī diǎn qǐchuáng, bā diǎn qù shàngkè. Tā de lǎoshī Wáng lǎoshī jiāo de fēicháng hǎo, tóngxuémen yě dōu hěn yǒuhǎo. Chúle xuéxí, Dàwèi hái hěn xǐhuan dǎ lánqiú hé Zhōngguó shūfǎ. Tā juéde xué Zhōngwén suīrán bù róngyì, dànshì fēicháng yǒu yìsi.',
      'David là một du học sinh người Mỹ, anh ấy học tiếng Hán tại Đại học Ngôn ngữ Bắc Kinh. Mỗi sáng anh dậy lúc 7 giờ, 8 giờ đi học. Thầy giáo của anh - thầy Vương dạy rất hay, các bạn cùng lớp cũng rất thân thiện. Ngoài học tập, David còn rất thích chơi bóng rổ và thư pháp Trung Quốc. Anh ấy cảm thấy học tiếng Trung tuy không dễ nhưng rất thú vị.',
      JSON.stringify([
        {
          id: 1,
          question: '大卫每天几点起床？(David mỗi ngày mấy giờ thức dậy?)',
          options: ['六点 (6 giờ)', '七点 (7 giờ)', '八点 (8 giờ)', '九点 (9 giờ)'],
          answer: '七点 (7 giờ)',
          explanation: 'Trong đoạn văn ghi rõ: 他每天早上七点起床。'
        },
        {
          id: 2,
          question: '大卫觉得学中文怎么样？(David cảm thấy học tiếng Trung thế nào?)',
          options: ['很容易 (Rất dễ)', '没意思 (Không thú vị)', '虽然不容易但很有意思 (Tuy không dễ nhưng rất thú vị)', '太难想放弃 (Quá khó muốn bỏ cuộc)'],
          answer: '虽然不容易但很有意思 (Tuy không dễ nhưng rất thú vị)',
          explanation: 'Câu kết đoạn văn: 他觉得学中文虽然不容易，但是非常有意思。'
        }
      ])
    );

    insertReading.run(
      'Kế hoạch du lịch Hàng Châu vào mùa xuân (HSK 3)',
      3,
      '中国有一句古话叫“上有天堂，下有苏杭”。今年春天，我和同事打算去杭州旅游。听说西湖的春景非常美丽，湖边的柳树发芽了，桃花也开了。我们准备坐高铁去，只需五个小时就能到达。除了游西湖，我们还要品尝正宗的西湖醋鱼和龙井茶。',
      'Zhōngguó yǒu yí jù gǔhuà jiào “shàng yǒu tiāntáng, xià yǒu Sū Háng”. Jīnnián chūntiān, wǒ hé tóngshì dǎsuàn qù Hángzhōu lǚyóu. Tīngshuō Xīhú de chūnjǐng fēicháng měilì, hú biān de liǔshù fāyá le, táohuā yě kāi le. Wǒmen zhǔnbèi zuò gāotiě qù, zhǐ xū wǔ gè xiǎoshí jiù néng dàodá. Chúle yóu Xīhú, wǒmen hái yào pǐncháng zhèngzōng de Xīhú cùyú hé Lóngjǐng chá.',
      'Trung Quốc có câu cổ ngữ "Trên có thiên đàng, dưới có Tô Hàng". Mùa xuân năm nay, tôi và đồng nghiệp dự định đi du lịch Hàng Châu. Nghe nói cảnh xuân ở Tây Hồ vô cùng tươi đẹp, liễu bên hồ đã đâm chồi, hoa đào cũng nở rộ. Chúng tôi dự định đi bằng tàu cao tốc, chỉ cần 5 tiếng là có thể đến nơi. Ngoài vãn cảnh Tây Hồ, chúng tôi còn muốn thưởng thức món cá giấm Tây Hồ chính gốc và trà Long Tỉnh.',
      JSON.stringify([
        {
          id: 1,
          question: '作者和同事打算坐什么交通工具去杭州？(Tác giả và đồng nghiệp dự định đi Hàng Châu bằng phương tiện gì?)',
          options: ['飞机 (Máy bay)', '高铁 (Tàu cao tốc)', '公共汽车 (Xe buýt)', '自己开车 (Tự lái xe)'],
          answer: '高铁 (Tàu cao tốc)',
          explanation: 'Trong bài có câu: 我们准备坐高铁去。'
        },
        {
          id: 2,
          question: '“上有天堂，下有苏杭”中的“杭”指的是哪里？(Chữ "Hàng" trong câu ngạn ngữ chỉ nơi nào?)',
          options: ['北京', '上海', '杭州', '广州'],
          answer: '杭州',
          explanation: 'Tô Hàng chỉ Tô Châu (苏州) và Hàng Châu (杭州).'
        }
      ])
    );
  }

  // 7. Speaking Exercises
  const speakingCount = db.prepare('SELECT count(*) as count FROM speaking_exercises').get();
  if (speakingCount.count === 0) {
    const insertSpeaking = db.prepare(`
      INSERT INTO speaking_exercises (title, hsk_level, prompt_cn, pinyin, vietnamese_meaning, difficulty)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertSpeaking.run('Giới thiệu bản thân cơ bản', 1, '我是越南人，我正在学习汉语。', 'Wǒ shì Yuènán rén, wǒ zhèngzài xuéxí Hànyǔ.', 'Tôi là người Việt Nam, tôi đang học tiếng Hán.', 'Dễ');
    insertSpeaking.run('Hỏi thăm bạn bè', 1, '你今天身体怎么样？好点了吗？', 'Nǐ jīntiān shēntǐ zěnmeyàng? Hǎo diǎn le ma?', 'Hôm nay sức khỏe bạn thế nào? Đã đỡ hơn chưa?', 'Dễ');
    insertSpeaking.run('Hỏi đường đến nhà ga', 2, '请问，去火车站应该怎么走？', 'Qǐngwèn, qù huǒchēzhàn yīnggāi zěnme zǒu?', 'Xin hỏi, đi đến ga xe lửa thì phải đi như thế nào?', 'Trung bình');
    insertSpeaking.run('Trình bày sở thích và kế hoạch', 3, '我最大的爱好是旅游，希望明年有机会去中国旅行。', 'Wǒ zuì dà de àihào shì lǚyóu, xīwàng míngnián yǒu jīhuì qù Zhōngguó lǚxíng.', 'Sở thích lớn nhất của tôi là đi du lịch, hy vọng năm tới có cơ hội đi du lịch Trung Quốc.', 'Khá');
  }

  // 8. Writing Exercises
  const writingCount = db.prepare('SELECT count(*) as count FROM writing_exercises').get();
  if (writingCount.count === 0) {
    const insertWriting = db.prepare(`
      INSERT INTO writing_exercises (title, hsk_level, type, content, sample_answer)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Sắp xếp câu
    insertWriting.run(
      'Sắp xếp trật tự từ: Đi siêu thị mua hoa quả',
      2,
      'sentence_reorder',
      JSON.stringify({
        scrambled_words: ['去超市', '我和妈妈', '买水果', '下午'],
        hint: 'Thời gian có thể đứng đầu hoặc sau chủ ngữ'
      }),
      '我和妈妈下午去超市买水果。'
    );

    insertWriting.run(
      'Sắp xếp trật tự từ: Hoàn thành bài tập về nhà',
      3,
      'sentence_reorder',
      JSON.stringify({
        scrambled_words: ['把', '写完了', '今天的作业', '他终于'],
        hint: 'Sử dụng cấu trúc câu chữ 把'
      }),
      '他终于把今天的作业写完了。'
    );

    // Tập viết chữ Hán
    insertWriting.run(
      'Tập viết chữ Hán cơ bản: 好 (Tốt, đẹp)',
      1,
      'hanzi_stroke',
      JSON.stringify({
        hanzi: '好',
        pinyin: 'hǎo',
        strokes_count: 6,
        radicals: '女 + 子',
        stroke_order: ['撇点', '撇', '提', '横撇', '弯钩', '横']
      }),
      '好 (hǎo)'
    );

    // Viết đoạn văn
    insertWriting.run(
      'Viết đoạn văn ngắn: Giới thiệu gia đình của bạn (khoảng 80 chữ)',
      3,
      'essay',
      JSON.stringify({
        prompt: '请写一篇短文介绍你的家庭（大约80个字），包括：家里有几口人、他们做什么工作、你们在一起经常做什么。'
      }),
      '我家有四口人：爸爸、妈妈、哥哥和我。爸爸是工程师，妈妈是高中老师，哥哥在大学读计算机，我是一名中学生。周末我们经常一起做饭、看电影，我们的家庭非常幸福温暖。'
    );
  }

  // 9. Standard HSK Exams (HSK 1, HSK 2, HSK 3)
  const examCount = db.prepare('SELECT count(*) as count FROM hsk_exams').get();
  if (examCount.count === 0) {
    const insertExam = db.prepare(`
      INSERT INTO hsk_exams (title, hsk_level, duration_minutes, total_questions, passing_score, sections)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // HSK 1 Mock Exam
    insertExam.run(
      'Đề Thi Thử HSK 1 - Chuẩn Quốc Tế Đề Số 1 (H11001)',
      1,
      35,
      20,
      120, // HSK 1 pass score 120/200
      JSON.stringify({
        listening: {
          title: 'Phần I: Nghe hiểu (听力)',
          duration_minutes: 15,
          total_questions: 10,
          questions: [
            {
              id: 'L1',
              audio_text: '男：听录音，判断对错：桌子上有三个苹果。',
              prompt: '桌子上有三个苹果。',
              type: 'true_false',
              options: ['Đúng (对)', 'Sai (错)'],
              answer: 'Đúng (对)',
              explanation: 'Khớp chính xác nội dung ghi âm.'
            },
            {
              id: 'L2',
              audio_text: '女：喂，李老师在学校吗？男：他在办公室。',
              prompt: '李老师现在在哪里？',
              type: 'multiple_choice',
              options: ['在医院', '在办公室', '在商店', '在家里'],
              answer: '在办公室',
              explanation: 'Lời thoại nam: 他在办公室。'
            },
            {
              id: 'L3',
              audio_text: '男：你想喝茶还是喝咖啡？女：给我一杯茶吧，谢谢。',
              prompt: '女的想喝什么？',
              type: 'multiple_choice',
              options: ['牛奶', '水', '茶', '咖啡'],
              answer: '茶',
              explanation: 'Người nữ trả lời: 给我一杯茶吧。'
            },
            {
              id: 'L4',
              audio_text: '女：明天星期几？男：明天星期日，我们不用上课。',
              prompt: '明天是星期几？',
              type: 'multiple_choice',
              options: ['星期五', '星期六', '星期日', '星期一'],
              answer: '星期日',
              explanation: 'Người nam nói: 明天星期日。'
            },
            {
              id: 'L5',
              audio_text: '男：这本书是谁的？女：是我买的，送给王老师的。',
              prompt: '这本书是要送给谁的？',
              type: 'multiple_choice',
              options: ['王老师', '张医生', '李同学', '妈妈'],
              answer: '王老师',
              explanation: 'Người nữ nói: 送给王老师的。'
            }
          ]
        },
        reading: {
          title: 'Phần II: Đọc hiểu (阅读)',
          duration_minutes: 17,
          total_questions: 10,
          questions: [
            {
              id: 'R1',
              prompt: 'Chọn từ thích hợp điền vào chỗ trống: 他是我的好____，我们经常一起玩。',
              options: ['朋友', '书店', '天气', '电影'],
              answer: '朋友',
              explanation: '的好朋友: bạn tốt của tôi.'
            },
            {
              id: 'R2',
              prompt: 'Chọn câu tương ứng nghĩa với: "Bây giờ là 3 giờ chiều"',
              options: ['现在是上午八点。', '现在是下午三点。', '今天星期三。', '他三岁了。'],
              answer: '现在是下午三点。',
              explanation: '下午: buổi chiều, 三点: 3 giờ.'
            },
            {
              id: 'R3',
              prompt: 'Chọn chữ Hán có phiên âm đúng: "xuéxí"',
              options: ['高兴', '睡觉', '学习', '看见'],
              answer: '学习',
              explanation: '学习 phát âm là xuéxí.'
            },
            {
              id: 'R4',
              prompt: 'Chọn câu trả lời đúng cho câu hỏi: "你喜欢吃中国菜吗？"',
              options: ['我是中国人。', '我很喜欢，很好吃。', '我不会开车。', '明天天气很好。'],
              answer: '我很喜欢，很好吃。',
              explanation: 'Trả lời đúng ngữ cảnh sở thích ẩm thực.'
            },
            {
              id: 'R5',
              prompt: 'Tìm từ khác loại trong nhóm từ sau:',
              options: ['爸爸', '妈妈', '姐姐', '出租车'],
              answer: '出租车',
              explanation: '出租车 là xe taxi (phương tiện), 3 từ còn lại là thành viên gia đình.'
            }
          ]
        }
      })
    );

    // HSK 2 Mock Exam
    insertExam.run(
      'Đề Thi Thử HSK 2 - Chuẩn Quốc Tế Đề Số 1 (H21001)',
      2,
      50,
      30,
      120, // HSK 2 pass score 120/200
      JSON.stringify({
        listening: {
          title: 'Phần I: Nghe hiểu (听力)',
          duration_minutes: 25,
          total_questions: 15,
          questions: [
            {
              id: 'L1',
              audio_text: '男：别看了，快睡觉吧，明天还要早起考试呢。女：好的，我看完这一页就睡。',
              prompt: '男的希望女的做什么？',
              options: ['去考试', '快点睡觉', '看书', '起床'],
              answer: '快点睡觉',
              explanation: 'Người nam khuyên: 别看了，快睡觉吧。'
            },
            {
              id: 'L2',
              audio_text: '女：服务员，我想买两件白色的衬衫。男：不好意思，白色的卖完了，黑色的可以吗？',
              prompt: '白色衬衫怎么样了？',
              options: ['很贵', '卖完了', '很大', '不好看'],
              answer: '卖完了',
              explanation: 'Nhân viên báo: 白色的卖完了。'
            }
          ]
        },
        reading: {
          title: 'Phần II: Đọc hiểu (阅读)',
          duration_minutes: 22,
          total_questions: 15,
          questions: [
            {
              id: 'R1',
              prompt: 'Chọn từ thích hợp: 医生说每天跑步对身体很____。',
              options: ['贵', '有好处', '慢', '便宜'],
              answer: '有好处',
              explanation: '对...有好处: có lợi cho...'
            },
            {
              id: 'R2',
              prompt: 'Đoạn văn: "我姐姐比我大三岁，她现在在一所小学当老师。她每天都坐地铁去上班。"',
              sub_question: '姐姐是怎么去上班的？',
              options: ['开车', '坐公共汽车', '坐地铁', '走路'],
              answer: '坐地铁',
              explanation: 'Trong bài có: 她每天都坐地铁去上班。'
            }
          ]
        }
      })
    );

    // HSK 3 Mock Exam
    insertExam.run(
      'Đề Thi Thử HSK 3 - Toàn diện 3 Phần (Nghe - Đọc - Viết)',
      3,
      85,
      40,
      180, // HSK 3 pass score 180/300
      JSON.stringify({
        listening: {
          title: 'Phần I: Nghe hiểu (听力)',
          duration_minutes: 35,
          total_questions: 15,
          questions: [
            {
              id: 'L1',
              audio_text: '男：听说你打算换工作，新的公司找到了吗？女：已经面试了，下个星期一去上班。',
              prompt: '女的什么时候去新公司上班？',
              options: ['这个周末', '下个星期一', '下个月', '还没决定'],
              answer: '下个星期一',
              explanation: 'Người nữ trả lời: 下个星期一去上班。'
            }
          ]
        },
        reading: {
          title: 'Phần II: Đọc hiểu (阅读)',
          duration_minutes: 30,
          total_questions: 15,
          questions: [
            {
              id: 'R1',
              prompt: 'Chọn liên từ thích hợp: 经过两年的努力，他的汉语水平____提高了。',
              options: ['几乎', '大大', '突然', '仍然'],
              answer: '大大',
              explanation: '大大提高: nâng cao đáng kể, tiến bộ vượt bậc.'
            }
          ]
        },
        writing: {
          title: 'Phần III: Viết (书写)',
          duration_minutes: 15,
          total_questions: 10,
          questions: [
            {
              id: 'W1',
              prompt: 'Sắp xếp các từ thành câu hoàn chỉnh: 借给我 / 把 / 这本书 / 弟弟',
              type: 'reorder',
              options: ['弟弟把这本书借给我。', '这本书把弟弟借给我。', '弟弟借给我把这本书。', '把这本书弟弟借给我。'],
              answer: '弟弟把这本书借给我。',
              explanation: 'Cấu trúc câu chữ 把: Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần phụ'
            }
          ]
        }
      })
    );
  }

  // 10. Sample Student Progress
  const progressCount = db.prepare('SELECT count(*) as count FROM learning_progress').get();
  if (progressCount.count === 0) {
    const insertProg = db.prepare(`
      INSERT INTO learning_progress (user_id, skill, completed_items_count, streak_days)
      VALUES (?, ?, ?, ?)
    `);
    insertProg.run(3, 'vocabulary', 45, 7);
    insertProg.run(3, 'grammar', 12, 7);
    insertProg.run(3, 'listening', 8, 7);
    insertProg.run(3, 'speaking', 6, 7);
    insertProg.run(3, 'reading', 10, 7);
    insertProg.run(3, 'writing', 5, 7);
  }

  console.log('✅ Khởi tạo cơ sở dữ liệu và dữ liệu mẫu HSK thành công!');
}

seedDatabase();
