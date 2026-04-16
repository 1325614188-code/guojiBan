const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'lib/locales');

const translations = {
  tryon: {
    title_adv: {
      "zh-CN": "沉浸换装 ✦ DOPPl",
      "zh-TW": "沉浸換裝 ✦ DOPPl",
      "en": "Advanced Try-On ✦ DOPPl",
      "ja": "没入型着せ替え ✦ DOPPl",
      "ko": "몰입형 피팅 ✦ DOPPl",
      "vi": "Thử Đồ Nâng Cao ✦ DOPPl",
      "th": "ลองชุดขั้นสูง ✦ DOPPl",
      "es": "Prueba de Ropa Avanzada ✦ DOPPl",
      "fr": "Essayage Avancé ✦ DOPPl",
      "de": "Erweiterte Anprobe ✦ DOPPl"
    },
    tab_create: {
      "zh-CN": "试试新衣", "zh-TW": "試試新衣", "en": "Try New Clothes", "ja": "新しい服を試す",
      "ko": "새 옷 입어보기", "vi": "Thử Quần Áo Mới", "th": "ลองชุดใหม่",
      "es": "Probar Ropa Nueva", "fr": "Essayer de Nouveaux Vêtements", "de": "Neue Kleidung Anprobieren"
    },
    tab_looks: {
      "zh-CN": "我的造型", "zh-TW": "我的造型", "en": "My Looks", "ja": "マイ・ルック",
      "ko": "내 스타일", "vi": "Phong Cách Của Tôi", "th": "ลุคของฉัน",
      "es": "Mis Estilos", "fr": "Mes Looks", "de": "Meine Looks"
    },
    my_avatar: {
      "zh-CN": "你的数字分身", "zh-TW": "你的數位分身", "en": "Your Digital Avatar", "ja": "デジタルアバター",
      "ko": "나의 디지털 아바타", "vi": "Hình Đại Diện Kỹ Thuật Số", "th": "อวตารดิจิทัลของคุณ",
      "es": "Tu Avatar Digital", "fr": "Votre Avatar Numérique", "de": "Ihr Digitaler Avatar"
    },
    upload_now: {
      "zh-CN": "立即上传", "zh-TW": "立即上傳", "en": "Upload Now", "ja": "今すぐアップロード",
      "ko": "지금 업로드", "vi": "Tải Lên Ngay", "th": "อัปโหลดทันที",
      "es": "Subir Ahora", "fr": "Télécharger Maintenant", "de": "Jetzt Hochladen"
    },
    re_upload: {
      "zh-CN": "重新上传", "zh-TW": "重新上傳", "en": "Re-upload", "ja": "再アップロード",
      "ko": "다시 업로드", "vi": "Tải Lên Lại", "th": "อัปโหลดอีกครั้ง",
      "es": "Volver a Subir", "fr": "Re-télécharger", "de": "Erneut Hochladen"
    },
    avatar_ready: {
      "zh-CN": "分身已就绪 ✨", "zh-TW": "分身已就緒 ✨", "en": "Avatar Ready ✨", "ja": "アバター準備完了 ✨",
      "ko": "아바타 준비 완료 ✨", "vi": "Hình Đại Diện Đã Sẵn Sàng ✨", "th": "อวตารพร้อมแล้ว ✨",
      "es": "Avatar Listo ✨", "fr": "Avatar Prêt ✨", "de": "Avatar Bereit ✨"
    },
    avatar_desc: {
      "zh-CN": "我们将保存该分身，以后的试穿只需挑选衣服即可，享受无缝换装体验。",
      "zh-TW": "我們將保存該分身，以後的試穿只需挑選衣服即可，享受無縫換裝體驗。",
      "en": "We will save this avatar for seamless future try-ons. Just pick clothes next time.",
      "ja": "次回からは服を選ぶだけでシームレスな着せ替えを楽しめるよう、アバターを保存します。",
      "ko": "나중에 옷을 고르기만 하면 심리스하게 입어볼 수 있도록 아바타를 저장합니다.",
      "vi": "Chúng tôi sẽ lưu hình đại diện này để thử đồ dễ dàng trong tương lai.",
      "th": "เราจะบันทึกอวตารนี้เพื่อให้ลองชุดในอนาคตได้อย่างราบรื่น",
      "es": "Guardaremos este avatar para futuras pruebas sin problemas.",
      "fr": "Nous enregistrerons cet avatar pour des essayages futurs fluides.",
      "de": "Wir speichern diesen Avatar für reibungslose zukünftige Anproben."
    },
    no_avatar: {
      "zh-CN": "尚无分身", "zh-TW": "尚無分身", "en": "No Avatar Yet", "ja": "アバターがありません",
      "ko": "아바타 없음", "vi": "Chưa Có Hình Đại Diện", "th": "ยังไม่มีอวตาร",
      "es": "Aún no hay avatar", "fr": "Pas Encore d'Avatar", "de": "Noch Kein Avatar"
    },
    upload_hint: {
      "zh-CN": "请上传一张清晰的正面半身照作为你的专属模特。",
      "zh-TW": "請上傳一張清晰的正面半身照作為你的專屬模特。",
      "en": "Please upload a clear upper-body photo as your model.",
      "vi": "Vui lòng tải lên một bức ảnh nửa người rõ nét làm người mẫu.",
      "default": "Please upload a clear upper-body photo as your model."
    },
    pick_style: {
      "zh-CN": "挑选新造型", "zh-TW": "挑選新造型", "en": "Pick New Style", "vi": "Chọn Phong Cách Mới", "default": "Pick New Style"
    },
    upload_clothes: {
      "zh-CN": "+ 上传自己的衣服", "zh-TW": "+ 上傳自己的衣服", "en": "+ Upload Your Clothes", "vi": "+ Tải Lên Quần Áo Của Bạn", "default": "+ Upload Your Clothes"
    },
    selected_cloth: {
      "zh-CN": "已选择该服饰参与生成", "zh-TW": "已選擇該服飾參與生成", "en": "Selected this clothing", "vi": "Đã chọn trang phục này", "default": "Selected this clothing"
    },
    switch_style: {
      "zh-CN": "您可以继续在下方自由切换款式。", "zh-TW": "您可以繼續在下方自由切換款式。", "en": "You can freely switch styles below.", "vi": "Bạn có thể tự do thay đổi phong cách bên dưới.", "default": "You can freely switch styles below."
    },
    result_ready: {
      "zh-CN": "✨ 上身效果出炉 ✨", "zh-TW": "✨ 上身效果出爐 ✨", "en": "✨ Your Look is Ready ✨", "vi": "✨ Kết Quả Sẵn Sàng ✨", "default": "✨ Your Look is Ready ✨"
    },
    save_look: {
      "zh-CN": "保存穿搭大图", "zh-TW": "保存穿搭大圖", "en": "Save Full Image", "vi": "Lưu Hình Ảnh Kích Thước Lớn", "default": "Save Full Image"
    },
    regenerate: {
      "zh-CN": "重新生成", "zh-TW": "重新生成", "en": "Regenerate", "vi": "Tạo Lại", "default": "Regenerate"
    },
    start_over: {
      "zh-CN": "从头再来", "zh-TW": "從頭再來", "en": "Start Over", "vi": "Bắt Đầu Lại", "default": "Start Over"
    },
    start_magic: {
      "zh-CN": "点击开启魔法换装 ✦", "zh-TW": "點擊開啟魔法換裝 ✦", "en": "Click to Start Magic ✦", "vi": "Nhấn Để Bắt Đầu Phép Thuật ✦", "default": "Click to Start Magic ✦"
    },
    processing: {
      "zh-CN": "AI 处理中", "zh-TW": "AI 處理中", "en": "AI Processing", "vi": "Đang Xử Lý", "default": "AI Processing"
    },
    need_avatar_cloth: {
      "zh-CN": "需先上传数字分身并选择一件衣服", "zh-TW": "需先上傳數位分身並選擇一件衣服", "en": "Please upload avatar and select clothes first", "vi": "Vui lòng tải lên hình đại diện và chọn trang phục trước", "default": "Please upload avatar and select clothes first"
    },
    delete_confirm: {
      "zh-CN": "确定删除这个试穿记录吗？", "zh-TW": "確定刪除這個試穿記錄嗎？", "en": "Delete this look?", "vi": "Xóa kiểu dáng này?", "default": "Delete this look?"
    },
    empty_lookbook: {
      "zh-CN": "你的穿搭画册还是空的哦", "zh-TW": "你的穿搭畫冊還是空的哦", "en": "Your lookbook is empty", "vi": "Sổ ảnh phong cách của bạn đang trống", "default": "Your lookbook is empty"
    },
    try_new_clothes: {
      "zh-CN": "快去试试新衣服吧！", "zh-TW": "快去試試新衣服吧！", "en": "Try some new clothes!", "vi": "Hãy thử một số trang phục mới!", "default": "Try some new clothes!"
    },
    saved: {
      "zh-CN": "保存", "zh-TW": "保存", "en": "Save", "vi": "Lưu", "default": "Save"
    },
    gen_failed: {
      "zh-CN": "生成失败，请稍后重试", "zh-TW": "生成失敗，請稍後重試", "en": "Generation failed, please try again", "vi": "Tạo thất bại, vui lòng thử lại sau", "default": "Generation failed, please try again"
    },
    loading_tip_1: { "zh-CN": "AI 正在测量您的身形比例...", "en": "AI is measuring proportions...", "vi": "AI đang đo tỷ lệ...", "default": "AI is measuring proportions..." },
    loading_tip_2: { "zh-CN": "正在分析衣物材质与纹理...", "en": "Analyzing material and texture...", "vi": "Đang phân tích chất liệu...", "default": "Analyzing material and texture..." },
    loading_tip_3: { "zh-CN": "光影渲染中，请稍候...", "en": "Rendering light and shadow...", "vi": "Đang kết xuất ánh sáng...", "default": "Rendering light and shadow..." },
    loading_tip_4: { "zh-CN": "马上就好啦，魔法即将完成 ✨!", "en": "Almost done, magic finishing ✨!", "vi": "Sắp xong rồi ✨!", "default": "Almost done, magic finishing ✨!" }
  },
  makeup: {
    title: {
      "zh-CN": "美妆效果", "zh-TW": "美妝效果", "en": "Makeup Effect", "vi": "Hiệu Ứng Trang Điểm", "default": "Makeup Effect"
    },
    upload_face: {
      "zh-CN": "1. 上传正面人脸照片", "zh-TW": "1. 上傳正面人臉照片", "en": "1. Upload Front Face Photo", "vi": "1. Tải Ảnh Chân Dung Lên", "default": "1. Upload Front Face Photo"
    },
    upload_face_hint: {
      "zh-CN": "请上传清晰的正面照片", "zh-TW": "請上傳清晰的正面照片", "en": "Please upload a clear front face photo", "vi": "Vui lòng tải lên ảnh chân dung rõ nét", "default": "Please upload a clear front face photo"
    },
    select_style: {
      "zh-CN": "2. 选择化妆风格", "zh-TW": "2. 選擇化妝風格", "en": "2. Select Makeup Style", "vi": "2. Chọn Phong Cách Trang Điểm", "default": "2. Select Makeup Style"
    },
    making_up: {
      "zh-CN": "美妆中...", "zh-TW": "美妝中...", "en": "Applying Makeup...", "vi": "Đang Trang Điểm...", "default": "Applying Makeup..."
    },
    start: {
      "zh-CN": "开始魔法美妆 💄", "zh-TW": "開始魔法美妝 💄", "en": "Start Magic Makeup 💄", "vi": "Bắt Đầu Trang Điểm 💄", "default": "Start Magic Makeup 💄"
    },
    result_title: {
      "zh-CN": "✨ 这是你的美妆效果图：", "zh-TW": "✨ 這是你的美妝效果圖：", "en": "✨ Here is your makeup result:", "vi": "✨ Đây là kết quả trang điểm của bạn:", "default": "✨ Here is your makeup result:"
    },
    save_album: {
      "zh-CN": "保存到相册", "zh-TW": "保存到相冊", "en": "Save to Album", "vi": "Lưu Vào Thư Viện", "default": "Save to Album"
    }
  },
  simple_tryon: {
    title_clothes: {
      "zh-CN": "虚拟试穿", "zh-TW": "虛擬試穿", "en": "Virtual Try-On", "vi": "Thử Đồ Ảo", "default": "Virtual Try-On"
    },
    title_accessories: {
      "zh-CN": "配饰试戴", "zh-TW": "配飾試戴", "en": "Try On Accessories", "vi": "Thử Phụ Kiện", "default": "Try On Accessories"
    },
    upload_upper: {
      "zh-CN": "1. 上传上半身人脸照片", "zh-TW": "1. 上傳上半身人臉照片", "en": "1. Upload Upper Body Photo", "vi": "1. Tải Lên Ảnh Nửa Người", "default": "1. Upload Upper Body Photo"
    },
    detecting: {
      "zh-CN": "检测照片中...", "zh-TW": "檢測照片中...", "en": "Detecting...", "vi": "Đang Phát Hiện...", "default": "Detecting..."
    },
    upload_upper_hint: {
      "zh-CN": "请上传清晰的上半身照片", "zh-TW": "請上傳清晰的上半身照片", "en": "Please upload clear upper body photo", "vi": "Vui lòng tải lên ảnh nửa người rõ nét", "default": "Please upload clear upper body photo"
    },
    upload_cloth: {
      "zh-CN": "2. 上传服装照片", "zh-TW": "2. 上傳服裝照片", "en": "2. Upload Clothing", "vi": "2. Tải Lên Quần Áo", "default": "2. Upload Clothing"
    },
    upload_ring: {
      "zh-CN": "2. 上传耳坠照片", "zh-TW": "2. 上傳耳墜照片", "en": "2. Upload Earring", "vi": "2. Tải Lên Khuyên Tai", "default": "2. Upload Earring"
    },
    generating: {
      "zh-CN": "生成中...", "zh-TW": "生成中...", "en": "Generating...", "vi": "Đang Tạo...", "default": "Generating..."
    },
    start_magic: {
      "zh-CN": "开始魔法生成 ✨", "zh-TW": "開始魔法生成 ✨", "en": "Start Magic Generation ✨", "vi": "Bắt Đầu Tạo ✨", "default": "Start Magic Generation ✨"
    },
    result_title: {
      "zh-CN": "锵锵！这是你的试穿效果图：", "zh-TW": "鏘鏘！這是你的試穿效果圖：", "en": "Ta-da! Here is your try-on result:", "vi": "Ta-da! Đây là kết quả thử của bạn:", "default": "Ta-da! Here is your try-on result:"
    }
  }
};

const styles = {
    makeup: {
        natural_name: { "zh-CN": "自然裸妆", "en": "Natural Makeup", "vi": "Trang Điểm Tự Nhiên", "default": "Natural Makeup" },
        natural_desc: { "zh-CN": "淡雅自然，突出皮肤质感", "en": "Elegant, highlights skin texture", "vi": "Trang nhã, làm nổi bật kết cấu da", "default": "Elegant, highlights skin texture" },
        korean_name: { "zh-CN": "韩式水光妆", "en": "Korean Dewy", "vi": "Trang Điểm Hàn Quốc", "default": "Korean Dewy" },
        korean_desc: { "zh-CN": "水润光泽，清透感十足", "en": "Dewy and clear look", "vi": "Nhìn trong trẻo và mọng nước", "default": "Dewy and clear look" },
        european_name: { "zh-CN": "欧美烟熏妆", "en": "European Smoky", "vi": "Trang Điểm Khói", "default": "European Smoky" },
        european_desc: { "zh-CN": "深邃立体，气场全开", "en": "Deep, 3D, powerful vibe", "vi": "Sâu, 3D, phong cách mạnh mẽ", "default": "Deep, 3D, powerful vibe" },
        sweet_name: { "zh-CN": "甜美少女妆", "en": "Sweet Girl", "vi": "Cô Gái Ngọt Ngào", "default": "Sweet Girl" },
        sweet_desc: { "zh-CN": "粉嫩可爱，减龄元气", "en": "Pinkish, cute, youthful", "vi": "Hồng hào, dễ thương, trẻ trung", "default": "Pinkish, cute, youthful" },
        elegant_name: { "zh-CN": "优雅名媛妆", "en": "Elegant Lady", "vi": "Quý Cô Thanh Lịch", "default": "Elegant Lady" },
        elegant_desc: { "zh-CN": "精致高级，气质出众", "en": "Exquisite, premium, elegant", "vi": "Tinh tế, cao cấp, thanh lịch", "default": "Exquisite, premium, elegant" },
        retro_name: { "zh-CN": "复古港风妆", "en": "Retro Hong Kong", "vi": "Hồng Kông Cổ Điển", "default": "Retro Hong Kong" },
        retro_desc: { "zh-CN": "浓眉红唇，经典复古", "en": "Dark brows, red lips", "vi": "Lông mày đậm, môi đỏ", "default": "Dark brows, red lips" }
    }
}

fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filepath = path.join(localesDir, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    data.tryon = data.tryon || {};
    Object.keys(translations.tryon).forEach(key => {
      data.tryon[key] = translations.tryon[key][lang] || translations.tryon[key]['default'] || translations.tryon[key]['en'];
    });

    data.makeup = data.makeup || {};
    Object.keys(translations.makeup).forEach(key => {
      data.makeup[key] = translations.makeup[key][lang] || translations.makeup[key]['default'] || translations.makeup[key]['en'];
    });
    Object.keys(styles.makeup).forEach(key => {
        data.makeup[key] = styles.makeup[key][lang] || styles.makeup[key]['default'] || styles.makeup[key]['en'];
    });

    data.simple_tryon = data.simple_tryon || {};
    Object.keys(translations.simple_tryon).forEach(key => {
      data.simple_tryon[key] = translations.simple_tryon[key][lang] || translations.simple_tryon[key]['default'] || translations.simple_tryon[key]['en'];
    });

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }
});

console.log('Translations patched!');
