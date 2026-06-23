import { AppSection } from '../types';

export interface IntroContent {
  desc: string;
  tips: string;
}

export type LanguageCode = 'zh-CN' | 'zh-TW' | 'en' | 'vi' | 'ja' | 'th' | 'fr' | 'es' | 'de' | 'ko';

export const INTRO_TRANSLATIONS: Record<string, Record<LanguageCode, IntroContent>> = {
  [AppSection.ADVANCED_TRY_ON]: {
    'zh-CN': { desc: '沉浸式虚拟换装系统，使用最先进的 AI 图像生成技术，为您在线生成穿搭上身效果。一键生成专属于您的数字分身，随时挑选搭配最新的时尚单品。', tips: '请上传一张清晰的正面半身照片以保证最佳的试穿效果。' },
    'zh-TW': { desc: '沉浸式虛擬換裝系統，使用最先進的 AI 圖像生成技術，為您線上生成穿搭上身效果。一鍵生成專屬於您的數位分身，隨時挑選搭配最新的時尚單品。', tips: '請上傳一張清晰的正面半身照片以保證最佳的試穿效果。' },
    'en': { desc: 'Immersive virtual try-on system powered by advanced AI image generation. Generate your digital avatar to preview the latest fashion items instantly.', tips: 'Please upload a clear front-facing half-body photo for the best results.' },
    'vi': { desc: 'Hệ thống thử đồ ảo thế hệ mới sử dụng AI tiên tiến. Tạo hình đại diện kỹ thuật số của bạn để xem trước các trang phục thời trang ngay lập tức.', tips: 'Vui lòng tải lên ảnh nửa người rõ ràng, chính diện để có kết quả tốt nhất.' },
    'ja': { desc: '最先端のAI画像生成技術を駆使した没入型バーチャル試着システム。自分だけのデジタルアバターを作成し、最新ファッションを手軽に試着。', tips: '最高の試着効果を得るために、鮮明な正面の半身写真をアップロードしてください。' },
    'th': { desc: 'ระบบลองเสื้อผ้าเสมือนจริงขับเคลื่อนด้วย AI ขั้นสูง สร้างอวตารดิจิทัลส่วนตัวของคุณเพื่อดูตัวอย่างเครื่องแต่งกายแฟชั่นล่าสุดได้ทันที', tips: 'โปรดอัปโหลดภาพถ่ายครึ่งตัวด้านหน้าทีชัดเจนเพื่อผลลัพธ์ที่ดีที่สุด' },
    'fr': { desc: 'Système d\'essayage virtuel immersif utilisant une IA générative avancée. Créez votre avatar numérique pour prévisualiser instantanément les vêtements.', tips: 'Veuillez télécharger une photo de face nette à mi-corps pour un résultat optimal.' },
    'es': { desc: 'Sistema de prueba de ropa virtual inmersivo con IA de última generación. Genera tu avatar digital para ver cómo te quedan las últimas prendas.', tips: 'Por favor, sube una foto clara de frente de medio cuerpo para mejores resultados.' },
    'de': { desc: 'Immersives virtuelles Anprobesystem mit fortschrittlicher KI. Erstellen Sie Ihren digitalen Avatar, um die neuesten Modetrends sofort anzuprobieren.', tips: 'Bitte laden Sie ein klares, nach vorne gerichtetes Halbkörperfoto hoch.' },
    'ko': { desc: '최첨단 AI 이미지 생성 기술을 적용한 몰입형 가상 피팅 시스템. 나만의 디지털 아바타를 생성하여 최신 패션 아이템을 실시간으로 확인해보세요.', tips: '최상의 결과를 위해 선명한 정면 상반신 사진을 업로드해 주세요.' }
  },
  [AppSection.TRY_ON_CLOTHES]: {
    'zh-CN': { desc: '智能服装试穿助手，您可以上传任意服装图片与您的正面照片，AI 将精确合成衣物穿着后的垂坠与贴合感。', tips: '请分别上传您的正面照和一件精细的单件衣服照片。' },
    'zh-TW': { desc: '智能服裝試穿助手，您可以上傳任意服裝圖片與您的正面照片，AI 將精確合成衣物穿著後的垂墜與貼合感。', tips: '請分別上傳您的正面照和一件精細的單件衣服照片。' },
    'en': { desc: 'Smart clothing try-on assistant. Upload any clothing item and your photo, and AI will synthesize the natural drape and fit on your body.', tips: 'Please upload a front-facing photo of yourself and a clear photo of the garment.' },
    'vi': { desc: 'Trợ lý thử quần áo thông minh. Tải lên bất kỳ ảnh trang phục nào và AI sẽ dựng lại độ rủ và độ vừa vặn tự nhiên trên cơ thể bạn.', tips: 'Vui lòng tải lên ảnh chân dung chính diện và một ảnh chụp rõ nét trang phục.' },
    'ja': { desc: 'スマート服試着アシスタント。好きな衣服の画像と自身の写真をアップロードすると、AIが着用時の自然なドレープ感とフィット感を合成します。', tips: '自身の正面写真と、試着したい服の鮮明な写真をそれぞれアップロードしてください。' },
    'th': { desc: 'ผู้ช่วยลองเสื้อผ้าอัจฉริยะ อัปโหลดรูปเสื้อผ้าและรูปของคุณ แล้ว AI จะสังเคราะห์การทิ้งตัวและความพอดีของเสื้อผ้าบนร่างกายของคุณอย่างเป็นธรรมชาติ', tips: 'โปรดอัปโหลดรูปถ่ายด้านหน้าของคุณและรูปเสื้อผ้าที่ชัดเจนแยกกัน' },
    'fr': { desc: 'Assistant d\'essayage intelligent. Importez n\'importe quel vêtement et votre photo, l\'IA simulera le drapé et l\'ajustement naturel sur vous.', tips: 'Veuillez importer une photo de vous de face et une photo claire du vêtement.' },
    'es': { desc: 'Asistente de prueba inteligente. Sube cualquier prenda y tu foto, y la IA sintetizará la caída y el ajuste natural de la ropa en tu cuerpo.', tips: 'Sube una foto tuya de frente y una foto clara de la prenda por separado.' },
    'de': { desc: 'Intelligenter Anprobe-Assistent. Laden Sie ein beliebiges Kleidungsstück und Ihr Foto hoch, und die KI berechnet den Faltenwurf und die Passform.', tips: 'Bitte laden Sie ein Frontalfoto von sich und ein klares Foto des Kleidungsstücks hoch.' },
    'ko': { desc: '스마트 의류 피팅 도우미. 임의의 의류 사진과 정면 사진을 업로드하면, AI가 의류의 드레이프감과 핏을 자연스럽게 합성해 드립니다.', tips: '본인의 정면 사진과 입어보고 싶은 옷의 선명한 사진을 각각 업로드해 주세요.' }
  },
  [AppSection.TRY_ON_ACCESSORIES]: {
    'zh-CN': { desc: '配饰虚拟试戴工具，利用计算机视觉精准检测您的脸部与耳朵轮廓，在线融合耳环、项链、眼镜等时尚配饰的佩戴效果。', tips: '请保持光线充足，并上传露出面部与耳朵轮廓的正面照。' },
    'zh-TW': { desc: '配飾虛擬試戴工具，利用電腦視覺精準檢測您的臉部與耳朵輪廓，線上融合耳環、項鍊、眼鏡等時尚配飾的佩戴效果。', tips: '請保持光线充足，並上傳露出面部與耳朵輪廓的正面照。' },
    'en': { desc: 'Virtual accessory try-on. Using computer vision to detect facial and ear contours, it renders earrings, necklaces, and glasses on you.', tips: 'Ensure good lighting and upload a front photo showing your face and ears clearly.' },
    'vi': { desc: 'Thử phụ kiện ảo. Sử dụng thị giác máy tính phát hiện đường nét khuôn mặt và tai để lồng ghép bông tai, vòng cổ và kính mắt chân thực.', tips: 'Giữ ánh sáng tốt và tải lên ảnh chính diện để lộ rõ khuôn mặt và tai.' },
    'ja': { desc: 'アクセサリー仮想試着ツール。コンピュータビジョンで顔や耳の輪郭を検出し、イヤリング、ネックレス、メガネの着用イメージをシミュレート。', tips: '十分な光を確保し、顔と耳の輪郭がはっきりと見える正面写真をアップロードしてください。' },
    'th': { desc: 'เครื่องมือลองเครื่องประดับเสมือนจริง ตรวจจับใบหน้าและใบหูอย่างแม่นยำเพื่อผสานลองต่างหู สร้อยคอ และแว่นตาแฟชั่น', tips: 'โปรดรักษาแสงสว่างให้เพียงพอ และอัปโหลดรูปถ่ายด้านหน้าที่เห็นใบหน้าและใบหูชัดเจน' },
    'fr': { desc: 'Outil d\'essayage d\'accessoires virtuel. Détecte précisément les contours du visage et des oreilles pour simuler des boucles d\'oreilles, colliers ou lunettes.', tips: 'Assurez un bon éclairage et importez une photo de face dégageant bien le visage.' },
    'es': { desc: 'Prueba de accesorios virtual. Detecta con precisión los contornos de la cara y orejas para mostrar cómo te quedan pendientes, collares y gafas.', tips: 'Asegura buena iluminación y sube una foto de frente con la cara y orejas visibles.' },
    'de': { desc: 'Virtuelle Anprobe für Accessoires. Erkennt Gesichts- und Ohrkonturen präzise, um Ohrringe, Halsketten und Brillen virtuell anzuprobieren.', tips: 'Sorgen Sie für gute Beleuchtung und laden Sie ein Frontalfoto hoch, auf dem Ohren frei sind.' },
    'ko': { desc: '액세서리 가상 착용 툴. 컴퓨터 비전을 통해 얼굴과 귀의 윤곽을 정밀 감지하여 귀걸이, 목걸이, 안경 등의 착용 효과를 구현합니다.', tips: '밝은 곳에서 귀와 얼굴 윤곽이 잘 보이는 정면 사진을 업로드해 주세요.' }
  },
  [AppSection.HAIRSTYLE]: {
    'zh-CN': { desc: 'AI 虚拟发型设计魔镜，分析您的脸型结构、额头比例与五官气质，智能适配上百款潮流发型，帮您快速找到最契合的外在形象。', tips: '建议将头发理至耳后，上传无刘海遮挡的正面素颜照片。' },
    'zh-TW': { desc: 'AI 虛擬髮型設計魔鏡，分析您的臉型結構、額頭比例與五官氣質，智慧適配上百款潮流髮型，幫您快速找到最契合的外在形象。', tips: '建議將頭髮理至耳後，上傳無瀏海遮擋的正面素顏照片。' },
    'en': { desc: 'AI virtual hairstyle design. Analyze your face shape and facial features to match with hundreds of trending hairstyles, helping you find your perfect look.', tips: 'Put your hair behind ears and upload a clear front-facing photo without bangs.' },
    'vi': { desc: 'Thiết kế kiểu tóc ảo AI. Phân tích cấu trúc khuôn mặt và ngũ quan để gợi ý hàng trăm kiểu tóc thịnh hành, giúp bạn tìm ra phong cách phù hợp nhất.', tips: 'Nên vén tóc ra sau tai, tải lên ảnh mặt mộc chính diện không có tóc mái che khuất.' },
    'ja': { desc: 'AI仮想ヘアスタイル設計。顔の骨格やパーツの配置を分析し、トレンドの髪型から最も似合うスタイルを提案します。', tips: '髪を耳の後ろにまとめ、前髪が顔にかかっていない正面の素顔写真を推奨します。' },
    'th': { desc: 'ออกแบบทรงผมเสมือนจริงด้วย AI วิเคราะห์โครงหน้าและสัดส่วนใบหน้าเพื่อจับคู่กับทรงผมยอดนิยม ช่วยค้นหาลุคที่ลงตัวที่สุดสำหรับคุณ', tips: 'แนะนำให้ทัดหู รวบผม และอัปโหลดรูปถ่ายหน้าตรงที่ไม่มีหน้าม้าบัง' },
    'fr': { desc: 'Concepteur de coiffure virtuel IA. Analyse la forme du visage et des traits pour adapter des centaines de coupes tendances et trouver votre style idéal.', tips: 'Dégagez vos cheveux derrière les oreilles et importez une photo de face sans frange.' },
    'es': { desc: 'Diseñador de peinados virtual IA. Analiza la forma de tu rostro y facciones para probar cientos de peinados en tendencia y encontrar tu look ideal.', tips: 'Se recomienda recoger el cabello tras las orejas y subir una foto de frente sin flequillo.' },
    'de': { desc: 'Virtuelles Styling-Tool für Frisuren. Analysiert Ihre Gesichtsform und Gesichtszüge, um Hunderte von Trendfrisuren virtuell auszuprobieren.', tips: 'Streichen Sie das Haar hinter die Ohren und laden Sie ein Frontalfoto ohne Pony hoch.' },
    'ko': { desc: 'AI 가상 헤어스타일 디자인. 얼굴형과 이목구비 비율을 분석하여 트렌디한 헤어스타일과 매칭해 보며, 본인에게 어울리는 스타일을 찾아드립니다.', tips: '머리카락을 귀 뒤로 넘기고, 앞머리가 없는 정면 생얼 사진을 업로드하는 것을 권장합니다.' }
  },
  [AppSection.MAKEUP]: {
    'zh-CN': { desc: 'AI 虚拟彩妆魔镜，支持欧美妆、韩系裸妆、复古港风等多种彩妆风格，一键试用眼影、口红、腮红等上脸色彩，实现无接触安全试妆。', tips: '请在明亮光线下拍摄一张无眼镜、无刘海的正面脸部照片。' },
    'zh-TW': { desc: 'AI 虛擬彩妝魔鏡，支援歐美妝、韓系裸妝、復古港風等多種彩妝風格，一鍵試用眼影、口紅、腮紅等上臉色彩，實現無接觸安全試妝。', tips: '請在明亮光線下拍攝一張無眼鏡、無瀏海的正面臉部照片。' },
    'en': { desc: 'AI virtual makeup mirror. Try on classic styles like European/American glam, Korean nude, or retro. Preview eyeshadow, lipstick, and blush colors instantly.', tips: 'Please take a clear front face photo under bright light without glasses or bangs.' },
    'vi': { desc: 'Gương trang điểm ảo AI. Trải nghiệm nhiều phong cách từ trang điểm tự nhiên Hàn Quốc đến quyến rũ Âu Mỹ. Thử màu mắt, son môi và phấn má an toàn.', tips: 'Vui lòng chụp ảnh khuôn mặt chính diện trong điều kiện sáng rõ, không đeo kính.' },
    'ja': { desc: 'AI仮想メイク魔鏡。オルチャンメイク、ヌードメイク、レトロ風など様々なメイクに対応。アイシャドウやリップをお肌にのせてお試し。', tips: '明るい光の下で、メガネや前髪がない正面の顔写真を撮影してください。' },
    'th': { desc: 'กระจกแต่งหน้าเสมือนจริงด้วย AI รองรับทั้งลุคเกาหลี ยุโรป และย้อนยุค ทดลองทาอายแชโดว์ ลิปสติก และบลัชออนบนใบหน้าได้ในคลิกเดียว', tips: 'โปรดถ่ายรูปหน้าตรงในที่สว่างโดยไม่สวมแว่นตาและไม่มีหน้าม้าบัง' },
    'fr': { desc: 'Miroir de maquillage virtuel IA. Essayez différents styles (nude coréen, rétro, glam). Testez fards, rouges à lèvres et blushs en un clic.', tips: 'Prenez une photo de face sous une lumière claire, sans lunettes ni frange.' },
    'es': { desc: 'Espejo de maquillaje virtual IA. Prueba estilos coreano, retro o glam. Previsualiza sombras de ojos, labial y colorete al instante sin contacto.', tips: 'Toma una foto de frente con buena luz, sin usar gafas y sin flequillo.' },
    'de': { desc: 'Virtueller Make-up-Spiegel mit KI. Probieren Sie verschiedene Make-up-Stile aus. Testen Sie Lidschatten, Lippenstift und Rouge kontaktlos.', tips: 'Machen Sie ein Foto Ihres Gesichts von vorne bei gutem Licht, ohne Brille oder Pony.' },
    'ko': { desc: 'AI 가상 메이크업 거울. 내추럴 투명 메이크업부터 스모키 스타일까지 다양한 화장 스타일을 적용해 보고 아이섀도, 립스틱, 블러셔 등을 매칭해 보세요.', tips: '밝은 조명 아래서 안경을 벗고 앞머리가 없는 정면 사진을 찍어주세요.' }
  },
  [AppSection.BEAUTY_SCORE]: {
    'zh-CN': { desc: '基于三庭五眼黄金美学比例的智能颜值测评系统。AI 通过精准检测面部关键点，量化五官对称度、饱满度与立体度，输出美学评分与分析报告。', tips: '请拍摄一张表情自然放松、光线柔和均匀的正面脸部照片。' },
    'zh-TW': { desc: '基於三庭五眼黃金美學比例的智慧顏值測評系統。AI 通過精準檢測面部關鍵點，量化五官對稱度、飽滿度與立體度，輸出美學評分與分析報告。', tips: '請拍攝一張表情自然放鬆、光線柔和均勻的正面臉部照片。' },
    'en': { desc: 'Aesthetic evaluation system based on the Golden Ratio of facial symmetry. AI detects key points to assess proportions and provide a detailed beauty report.', tips: 'Take a relaxed front-facing photo under soft, even lighting with a neutral expression.' },
    'vi': { desc: 'Hệ thống chấm điểm nhan sắc dựa trên tỷ lệ vàng thẩm mỹ khuôn mặt. AI nhận diện các điểm mốc chính xác để đánh giá sự cân đối và phân tích vẻ đẹp.', tips: 'Chụp ảnh chính diện với biểu cảm tự nhiên, thư giãn dưới ánh sáng dịu nhẹ, đều màu.' },
    'ja': { desc: '黄金比や左右対称度に基づくAI顔立ち美学分析システム。顔の主要な特徴点を検出し、立体感やバランスを数値化して美学レポートを作成。', tips: '表情をリラックスさせ、光が均一に当たる正面の顔写真を撮影してください。' },
    'th': { desc: 'ระบบประเมินความงามบนใบหน้าตามอัตราส่วนทองคำทางสุนทรียศาสตร์ AI ตรวจจับจุดสำคัญเพื่อวัดความสมมาตรและสัดส่วนใบหน้า พร้อมออกรายงานการวิเคราะห์', tips: 'โปรดถ่ายรูปหน้าตรงในที่สว่างโดยผ่อนคลายสีหน้าและมีแสงสว่างสม่ำเสมอ' },
    'fr': { desc: 'Système d\'évaluation de beauté basé sur le nombre d\'or. L\'IA analyse la symétrie, la plénitude et les proportions du visage pour un rapport esthétique.', tips: 'Prenez une photo de face, expression détendue, sous une lumière douce et homogène.' },
    'es': { desc: 'Evaluación estética basada en la proporción áurea. La IA detecta puntos clave en el rostro para medir la simetría y proporciones del mismo.', tips: 'Toma una foto de frente con expresión relajada y luz suave y uniforme.' },
    'de': { desc: 'Ästhetik-Bewertungssystem basierend auf dem Goldenen Schnitt. Die KI analysiert die Symmetrie und Proportionen Ihres Gesichts für einen Schönheitsreport.', tips: 'Machen Sie ein entspanntes Foto von vorne bei weichem, gleichmäßigem Licht.' },
    'ko': { desc: '황금 비율 및 좌우 대칭 기준의 AI 외모 심미 평가 시스템. 얼굴 윤곽의 대칭과 입체감을 분석하여 미학 점수와 맞춤형 보고서를 제공합니다.', tips: '무표정의 편안한 상태에서 빛이 골고루 들어오는 정면 얼굴 사진을 찍어주세요.' }
  },
  [AppSection.COUPLE_FACE]: {
    'zh-CN': { desc: '情侣夫妻相指数测试，对比两张照片中的骨骼结构、五官排布和笑肌走向，基于 AI 深度度量学习计算你们的相似度与默契指数。', tips: '请分别上传两张清晰的正面肖像照片进行默契度比对。' },
    'zh-TW': { desc: '情侶夫妻相指數測試，對比兩張照片中的骨骼結構、五官排布和笑肌走向，基於 AI 深度度量學習計算你們的相似度與默契指數。', tips: '請分別上傳兩張清晰的正面肖像照片進行默契度比對。' },
    'en': { desc: 'Couple Face similarity test. Compare the bone structure, facial alignment, and smile dynamics using deep learning to calculate your match index.', tips: 'Please upload two clear front-facing portrait photos to compare.' },
    'vi': { desc: 'Kiểm tra tướng phu thê tình nhân. So sánh cấu trúc xương, cách sắp xếp ngũ quan và cơ mặt khi cười giữa hai ảnh để tính chỉ số tương hợp phu thê.', tips: 'Vui lòng tải lên hai ảnh chân dung chính diện rõ nét của hai người.' },
    'ja': { desc: 'カップル相性・夫婦顔テスト。2枚の写真の骨格構造、目元の配置、表情筋の動きを比較し、ディープラーニングで顔の似ている度合いを算出。', tips: '相性を比較するために、それぞれの鮮明な正面ポートレート写真をアップロードしてください。' },
    'th': { desc: 'ทดสอบใบหน้าคู่รัก เปรียบเทียบโครงสร้างกระดูก การจัดวางอวัยวะ และการแสดงออกของกล้ามเนื้อเพื่อคำนวณค่าความคล้ายคลึงและเคมีที่ตรงกัน', tips: 'โปรดอัปโหลดรูปถ่ายหน้าตรงที่ชัดเจนของคนสองคนเพื่อเปรียบเทียบเคมี' },
    'fr': { desc: 'Test de ressemblance de couple. Compare la structure osseuse, l\'alignement des traits et les expressions pour évaluer l\'indice de compatibilité physique.', tips: 'Veuillez importer deux photos de portraits de face distinctes et nettes.' },
    'es': { desc: 'Prueba de parecido de pareja. Compara la estructura ósea y facciones mediante aprendizaje profundo para calcular vuestro índice de afinidad facial.', tips: 'Sube dos fotos claras de frente para realizar la comparación de parecido.' },
    'de': { desc: 'Partnerschafts-Ähnlichkeitstest. Vergleicht Knochenstruktur, Gesichtsausrichtung und Lächeln zweier Personen zur Berechnung des Ähnlichkeitsindex.', tips: 'Bitte laden Sie zwei klare Porträtfotos von vorne hoch, um die Ähnlichkeit zu vergleichen.' },
    'ko': { desc: '커플/부부 닮은꼴 테스트. 두 사람 사진의 골격 구조, 이목구비 배치, 웃을 때의 미소를 비교하여 닮은꼴 지수와 케미 분석을 제공합니다.', tips: '닮은꼴 지수를 비교할 두 사람의 선명한 정면 프로필 사진을 각각 업로드해 주세요.' }
  },
  [AppSection.TONGUE_DIAGNOSIS]: {
    'zh-CN': { desc: '趣味舌诊大健康望诊系统。结合传统中医辨证理论，AI 算法检测舌形、舌色、苔质与裂纹，为您提供身体健康状态参考及生活膳食建议。', tips: '请找个明亮地方，自然伸出舌头（不要使劲），拍下舌部照片。' },
    'zh-TW': { desc: '趣味舌診大健康望診系統。結合傳統中醫辨證理論，AI 算法檢測舌形、舌色、苔質與裂紋，為您提供身體健康狀態參考及生活膳食建議。', tips: '請找個明亮地方，自然伸出舌頭（不要使勁），拍下舌部照片。' },
    'en': { desc: 'Tongue diagnosis helper. Based on traditional medical theories, AI analyzes tongue shape, color, and coating to provide lifestyle suggestions.', tips: 'In a well-lit area, stick your tongue out naturally and take a clear close-up.' },
    'vi': { desc: 'Xem lưỡi đoán sức khỏe AI. Kết hợp lý thuyết y học cổ truyền, AI phân tích hình dáng, màu sắc và rêu lưỡi để đưa ra gợi ý chế độ ăn uống sinh hoạt.', tips: 'Tìm nơi sáng rõ, đưa lưỡi ra tự nhiên (không gồng) và chụp ảnh cận cảnh lưỡi.' },
    'ja': { desc: 'AI舌診健康アシスタント。伝統東洋医学の証（しょう）の理論に基づき、舌の形・色・苔の状態を分析し、日々の食事や健康のヒントを提案。', tips: '明るい場所で、舌を自然に伸ばし（力を入れず）、舌全体の写真を撮影してください。' },
    'th': { desc: 'ระบบตรวจสุขภาพด้วยการดูลิ้น ผสานทฤษฎีการแพทย์แผนโบราณ วิเคราะห์สี ขนาด และฝ้าบนลิ้นเพื่อแนะนำการรับประทานอาหารและการดำเนินชีวิต', tips: 'โปรดหาที่สว่าง แลบลิ้นออกมาอย่างเป็นธรรมชาติ (อย่าเกร็ง) แล้วถ่ายรูปเฉพาะลิ้น' },
    'fr': { desc: 'Aide au diagnostic par la langue. Basée sur la médecine traditionnelle, l\'IA analyse la forme, la couleur et le dépôt lingual pour des conseils bien-être.', tips: 'Dans un endroit bien éclairé, tirez la langue naturellement et prenez un plan serré net.' },
    'es': { desc: 'Análisis de la lengua IA. Basado en principios tradicionales de salud, analiza la forma, color y saburra de la lengua para recomendar hábitos saludables.', tips: 'Busca un lugar iluminado, saca la lengua con naturalidad (sin forzar) y toma una foto.' },
    'de': { desc: 'Zungendiagnostik-Assistent. Basierend auf traditioneller Medizin analysiert die KI Form, Farbe und Belag der Zunge für Gesundheitsempfehlungen.', tips: 'Strecken Sie die Zunge in einer gut beleuchteten Umgebung locker heraus und machen Sie ein Foto.' },
    'ko': { desc: '재미로 보는 AI 건강 설진 분석. 한의학 진단 이론을 바탕으로 혀의 형태, 색상, 백태 분포를 분석하여 건강 가이드와 식단 추천을 제공합니다.', tips: '밝은 곳에서 혀에 힘을 빼고 자연스럽게 내민 상태의 혀 사진을 찍어주세요.' }
  },
  [AppSection.FACE_COLOR]: {
    'zh-CN': { desc: '中医面色健康望诊。AI 抓取面部五轮部位色彩反射，结合脏腑表征映射，识别暗沉、红赤、萎黄等肤色分布，提供气血与气色调理指南。', tips: '请上传一张未化妆、自然光线下拍摄的脸部正面免冠照。' },
    'zh-TW': { desc: '中醫面色健康望診。AI 抓取面部五輪部位色彩反射，結合臟腑表徵映射，識別暗沉、紅赤、委黃等膚色分布，提供氣血與氣色調理指南。', tips: '請上傳一張未化妝、自然光線下拍攝的臉部正面免冠照。' },
    'en': { desc: 'Facial complexion analysis. AI captures skin color anomalies (dullness, redness, paleness) to identify wellness imbalances and suggest lifestyle tips.', tips: 'Upload a bare-faced front photo of your face taken in natural, bright daylight.' },
    'vi': { desc: 'Xem sắc mặt đoán sức khỏe. AI phát hiện các vùng sắc tố trên da mặt (sạm, đỏ, vàng úa) để nhận biết khí huyết cơ thể và đưa ra gợi ý điều hòa.', tips: 'Vui lòng tải lên ảnh chính diện mặt mộc, chụp dưới ánh sáng tự nhiên.' },
    'ja': { desc: '顔色AI望診システム。顔の部位ごとのカラー反射を捉え、くすみ、赤み、黄ばみなどの分布パターンから気血の流れやセルフケアをガイド。', tips: 'すっぴんの状態で、自然光の下で撮影した正面の顔写真をアップロードしてください。' },
    'th': { desc: 'วิเคราะห์สีหน้าตามตำราแพทย์แผนจีน AI ตรวจจับค่าสะท้อนสีผิวบนใบหน้าเพื่อระบุภาวะหมองคล้ำ แดง หรือเหลือง เพื่อแนะนำการปรับสมดุลลมปราณและโลหิต', tips: 'โปรดอัปโหลดรูปถ่ายหน้าตรงที่ไม่ได้แต่งหน้าและถ่ายในแสงธรรมชาติ' },
    'fr': { desc: 'Analyse du teint. L\'IA capte les anomalies de couleur cutanée (teint terne, rougeurs) pour identifier les déséquilibres internes et conseiller des soins.', tips: 'Veuillez importer une photo de face sans maquillage prise sous une lumière naturelle.' },
    'es': { desc: 'Análisis de complexión facial. La IA detecta alteraciones del color de la piel para deducir bloqueos de energía y sugerir pautas de bienestar.', tips: 'Sube una foto de frente con el rostro limpio, tomada con luz de día natural.' },
    'de': { desc: 'Gesichtsfarben-Gesundheitsanalyse. Die KI analysiert Hautton-Verteilungen (Fahlheit, Rötung), um auf das Wohlbefinden zu schließen und Tipps zu geben.', tips: 'Bitte laden Sie ein ungeschminktes Frontalfoto hoch, das bei natürlichem Tageslicht aufgenommen wurde.' },
    'ko': { desc: '한의학 안색 분석 시스템. 얼굴 부위별 색상 반사를 감지하여 어둡거나 붉은 톤의 기색 분포를 파악하고 기혈 순환 가이드를 제공합니다.', tips: '화장을 하지 않은 상태에서 자연광 아래서 찍은 얼굴 정면 사진을 업로드해 주세요.' }
  },
  [AppSection.FACE_READING]: {
    'zh-CN': { desc: '传统相术面相学评测，分析面部十二宫位、三停比例与五官格局，结合AI骨骼识别技术，解析性格潜能、人际关系与命运流年。', tips: '请上传一张表情平稳、无刘海遮挡、光线均匀的正面半身照。' },
    'zh-TW': { desc: '傳統相術面相學評測，分析面部十二宮位、三停比例與五官格局，結合AI骨骼識別技術，解析性格潛能、人際關係與命運流年。', tips: '請上傳一張表情平穩、無瀏海遮擋、光線均勻的正面半身照。' },
    'en': { desc: 'Traditional physiognomy and face reading. Analyze facial structure, eyes, eyebrows, nose, and mouth to reveal personality traits and potential fate path.', tips: 'Upload a front half-body photo with a neutral expression and no hair bangs covering face.' },
    'vi': { desc: 'Nhân tướng học khuôn mặt truyền thống. Phân tích 12 cung mệnh trên mặt, tỷ lệ tam đình ngũ quan bằng AI để giải mã tính cách, các mối quan hệ xã hội.', tips: 'Vui lòng tải lên ảnh chân dung chính diện rõ ràng, không bị tóc mái che trán.' },
    'ja': { desc: '伝統観相学・顔相分析。AIの骨格認識技術で顔の十二宮や三停の比率をスキャンし、性格特性や運勢の流れを総合的にアドバイス。', tips: '無表情で、前髪が顔にかかっていない、光が均一な正面の半身写真を推奨します。' },
    'th': { desc: 'ประเมินโหงวเฮ้งตามตำราดั้งเดิม วิเคราะห์สิบสองวังใบหน้า สัดส่วนใบหน้า และลักษณะห้าประสาทสัมผัสเพื่ออ่านบุคลิกภาพ ศักยภาพ และแนวโน้มโชคชะตา', tips: 'โปรดอัปโหลดรูปถ่ายหน้าตรงครึ่งตัวที่มีสีหน้าผ่อนคลายและไม่มีผมม้าปิดบัง' },
    'fr': { desc: 'Physiognomonie traditionnelle. Analyse de la structure du visage, des yeux, du nez et de la bouche pour déceler les traits de caractère et le chemin de vie.', tips: 'Importez une photo de face neutre, sans frange couvrant le front.' },
    'es': { desc: 'Lectura facial de fisonomía tradicional. Analiza las doce facetas y proporciones faciales para interpretar rasgos de personalidad e inclinación del destino.', tips: 'Sube una foto de frente con expresión neutra y sin flequillo que cubra la cara.' },
    'de': { desc: 'Traditionelle Gesichtlesung. Analysiert die Gesichtsstruktur und die Züge zur Deutung von Persönlichkeitsmerkmalen und Lebenswegen.', tips: 'Laden Sie ein Halbkörperfoto von vorne mit neutralem Ausdruck und freier Stirn hoch.' },
    'ko': { desc: '전통 관상학 분석. 얼굴의 12궁 및 이목구비 배치를 분석하고 AI 골격 인식 기술을 결합하여 성격 성향 및 인생의 흐름을 짚어드립니다.', tips: '앞머리가 이마를 가리지 않도록 정리한 상태에서 무표정으로 찍은 정면 사진을 올려주세요.' }
  },
  [AppSection.FENG_SHUI]: {
    'zh-CN': { desc: '现代风水与居家格局评测，根据您上传的房间布局草图与方位信息，AI 量化五行分布与穿堂风、对冲等格局，提供定制的调整与化解方案。', tips: '请上传一张清晰的室内户型图或房间布局手绘草图。' },
    'zh-TW': { desc: '現代風水與居家格局評測，根據您上傳的房間布局草圖與方位資訊，AI 量化五行分布與穿堂風、對衝等格局，提供定制的調整與化解方案。', tips: '請上傳一張清晰的室內戶型圖或房間布局手繪草圖。' },
    'en': { desc: 'Feng Shui environment analyzer. Upload a room sketch and orientation, and AI will evaluate the spatial layout and energy flow to suggest modifications.', tips: 'Please upload a clear floor plan or hand-drawn sketch of your room layout.' },
    'vi': { desc: 'Phong thủy không gian sống hiện đại. Dựa trên bản vẽ bố trí phòng và hướng nhà, AI tính toán sự phân bổ ngũ hành và đưa ra giải pháp hóa giải.', tips: 'Vui lòng tải lên ảnh bản vẽ sơ đồ mặt bằng nhà hoặc phòng vẽ tay rõ ràng.' },
    'ja': { desc: '現代風水・間取り分析。部屋のレイアウト図や方位から、AIが五行の偏りや気の流れを測定し、開運模様替えのアドバイスを提示します。', tips: '鮮明な間取り図または手書きの部屋のレイアウトスケッチをアップロードしてください。' },
    'th': { desc: 'ประเมินฮวงจุ้ยและผังห้อง วิเคราะห์การกระจายตัวของธาตุทั้งห้าและการไหลเวียนของพลังงานตามผังห้องและทิศทาง เพื่อแนะนำวิธีปรับแก้ฮวงจุ้ย', tips: 'โปรดอัปโหลดแผนผังห้องหรือภาพวาดลายเส้นผังห้องที่ชัดเจน' },
    'fr': { desc: 'Analyseur Feng Shui. Importez le plan de votre pièce et son orientation, l\'IA évaluera les flux d\'énergie pour proposer des ajustements.', tips: 'Veuillez importer un plan clair ou un croquis fait main de la disposition de la pièce.' },
    'es': { desc: 'Analizador Feng Shui. Evalúa la distribución espacial y flujo de energía según el croquis de tu habitación para sugerir consejos de decoración.', tips: 'Sube un plano de planta claro o un dibujo a mano del diseño de tu habitación.' },
    'de': { desc: 'Feng-Shui-Raumplaner. Analysiert die Raumanordnung und den Energiefluss anhand Ihres Grundrisses, um Raumkorrekturen vorzuschlagen.', tips: 'Bitte laden Sie einen klaren Grundriss oder eine handgezeichnete Skizze Ihres Zimmers hoch.' },
    'ko': { desc: '현대 생활 풍수 및 인테리어 분석. 업로드한 평면도 및 방 구조 도면과 방향 정보를 기준으로 공간의 에너지 흐름을 분석해 맞춤 비보 방안을 제시합니다.', tips: '선명하게 촬영된 실내 평면도 또는 직접 그린 가구 배치 스케치를 업로드해 주세요.' }
  },
  [AppSection.CALENDAR]: {
    'zh-CN': { desc: '智能日历老黄历吉凶查询，结合建除十二神、紫白飞星等传统择吉方法，提供专属的每日宜忌提示，帮您选择出行开市的最佳时机。', tips: '请直接点击查询特定日期的宜忌流日信息。' },
    'zh-TW': { desc: '智慧日曆老黃曆吉凶查詢，結合建除十二神、紫白飛星等傳統擇吉方法，提供專屬的每日宜忌提示，幫您選擇出行開市的最佳時機。', tips: '請直接點擊查詢特定日期的宜忌流日資訊。' },
    'en': { desc: 'AI Almanac and Calendar guide. Analyzes ancient擇吉 (auspicious day selection) methods to recommend optimal timings for key events.', tips: 'Click to select any calendar date to query its detailed energy patterns.' },
    'vi': { desc: 'Xem ngày lành tháng tốt lão hoàng lịch. Kết hợp thuật trạch cát cổ truyền để đưa ra gợi ý những điều nên làm và kiêng kỵ hàng ngày cho bạn.', tips: 'Bấm chọn ngày cụ thể để tra cứu chi tiết thông tin cát hung hoàng lịch.' },
    'ja': { desc: 'スマート暦（万年暦・吉凶クエリ）。暦法や伝統の吉日選択法に基づいて、毎日の運気、行動のタイミングを提案。', tips: '特定のカレンダー日付を選択して、詳細なエネルギーパターンを照会してください。' },
    'th': { desc: 'ปฏิทินจีนโบราณอัจฉริยะ ค้นหาวันฤกษ์มงคลตามหลักโหราศาสตร์ดั้งเดิมเพื่อแนะนำช่วงเวลาที่ดีที่สุดสำหรับการเดินทาง เริ่มธุรกิจ หรือจัดงานสำคัญ', tips: 'โปรดเลือกวันที่ต้องการสอบถามเพื่อดูข้อมูลฤกษ์มงคลโดยละเอียด' },
    'fr': { desc: 'Almanach intelligent. Analyse les méthodes traditionnelles de sélection des jours favorables pour recommander le moment idéal pour chaque action.', tips: 'Sélectionnez une date sur le calendrier pour obtenir le profil énergétique.' },
    'es': { desc: 'Calendario y almanaque tradicional. Analiza los méthodes de selección de días propicios para sugerir los momentos óptimos para tus actividades.', tips: 'Elige cualquier fecha en el calendario para consultar su flujo energético diario.' },
    'de': { desc: 'Intelligenter Almanach. Nutzt traditionelle Methoden der Astrologie, um günstige Tage für wichtige Vorhaben und Termine zu ermitteln.', tips: 'Wählen Sie ein Datum im Kalender aus, um die detaillierten Energien abzufragen.' },
    'ko': { desc: '스마트 황력 및 일진 조회. 전통 일진 택일법을 적용하여 이사, 개업 등 중요 일정에 맞는 일별 맞춤 길흉 가이드를 제공합니다.', tips: '캘린더에서 조회를 원하는 특정 날짜를 터치하여 정보를 확인하세요.' }
  },
  [AppSection.LICENSE_PLATE]: {
    'zh-CN': { desc: '车牌号数字吉凶五行测算，提取车牌中的字母与数字组合，计算声母、韵母及数理磁场，匹配车主的八字气场，为您测评出行契合度。', tips: '请输入或拍摄您的车牌号码，并选择车主本人的阳历生日。' },
    'zh-TW': { desc: '車牌號數字吉凶五行測算，提取車牌中的字母與數字組合，計算聲母、韻母及數理磁場，匹配車主的八字氣場，為您測評出行契合度。', tips: '請輸入或拍攝您的車牌號碼，並選擇車主本人的陽曆生日。' },
    'en': { desc: 'License Plate numerology evaluator. Extract letters and digits to analyze the numerical magnetic field compatibility with the owner\'s energy.', tips: 'Enter or snap a photo of your license plate, and select the owner\'s birthday.' },
    'vi': { desc: 'Xem phong thủy biển số xe. Phân tích các chữ cái và con số trên biển số để tính toán từ trường ngũ hành kết hợp với bản mệnh chủ xe để đo độ tương hợp.', tips: 'Nhập hoặc chụp ảnh biển số xe của bạn, chọn ngày sinh của chủ xe.' },
    'ja': { desc: 'ナンバープレート五行・数理分析。文字と数字から数理磁場エネルギーを計算し、所有者の生年月日との調和度合いを測ります。', tips: 'ナンバープレート番号を入力または撮影し、所有者の生年月日を選択してください。' },
    'th': { desc: 'คำนวณเลขทะเบียนรถมงคล วิเคราะห์ค่าสนามแม่เหล็กตัวเลขและการรวมกลุ่มของอักษรและตัวเลขตามพลังวันเกิดของเจ้าของเพื่อประเมินความเข้ากันได้', tips: 'โปรดกรอกหรือถ่ายรูปป้ายทะเบียนรถของคุณ และเลือกวันเกิดของเจ้าของรถ' },
    'fr': { desc: 'Numérologie de plaque d\'immatriculation. Analyse les lettres et chiffres pour évaluer la compatibilité vibratoire avec la date de naissance du propriétaire.', tips: 'Saisissez ou photographiez votre plaque d\'immatriculation et renseignez l\'anniversaire.' },
    'es': { desc: 'Numerología de matrículas. Analiza las letras y dígitos para determinar la compatibilidad del campo energético con la fecha de nacimiento del dueño.', tips: 'Introduce o toma una foto de tu matrícula y selecciona la fecha de nacimiento del dueño.' },
    'de': { desc: 'Nummernschild-Numerologie. Analysiert die Buchstaben und Zahlen Ihres Kennzeichens, um die energetische Übereinstimmung mit Ihrem Geburtsdatum zu prüfen.', tips: 'Geben Sie Ihr Kennzeichen ein oder fotografieren Sie es, und wählen Sie Ihr Geburtsdatum.' },
    'ko': { desc: '차량 번호판 숫자 오행 분석. 번호판의 영문과 숫자를 추출하여 수리적 에너지장을 계산하고, 차주의 생년월일과 비교하여 운행 적합도를 분석합니다.', tips: '번호판 번호를 입력하거나 번호판 사진을 올린 후, 차주의 생년월일을 선택해 주세요.' }
  },
  [AppSection.MBTI_TEST]: {
    'zh-CN': { desc: '16型人格职业天赋（MBTI）深度测评，通过心理测量学量表分析您的注意力方向、认知感知和行动维度，生成您的性格画像与职业规划指导。', tips: '请在答题时根据直觉和真实情况选择，大约需要占用您 5 分钟时间。' },
    'zh-TW': { desc: '16型人格職業天賦（MBTI）深度測評，通過心理測量學量表分析您的注意力方向、認知感知和行動維度，生成您的性格畫像與職業規劃指導。', tips: '請在答題時根據直覺和真實情況選擇，大約需要占用您 5 分钟時間。' },
    'en': { desc: 'MBTI 16 Personalities and Career test. Analyzes your preferences in focusing energy, gathering information, and making decisions to outline your career path.', tips: 'Answer based on your intuition. The test will take approximately 5 minutes.' },
    'vi': { desc: 'Trắc nghiệm tính cách nghề nghiệp MBTI 16 nhóm tính cách. Phân tích các chiều hướng nhận thức, xử lý thông tin để phác họa sơ đồ nghề nghiệp của bạn.', tips: 'Hãy trả lời theo trực giác và thực tế của bạn, bài kiểm tra mất khoảng 5 phút.' },
    'ja': { desc: '16タイプ性格職業適性テスト（MBTI）。あなたのエネルギーの向き、認知、判断方法を分析し、最適なキャリアパスと性格診断書を作成。', tips: '直感とありのままの自分に基づいて回答してください。所要時間は約5分です。' },
    'th': { desc: 'แบบทดสอบบุคลิกภาพ MBTI 16 แบบและแนวทางอาชีพ วิเคราะห์ความชอบในการมุ่งเน้นพลังงาน การรับรู้ข้อมูล และการตัดสินใจเพื่อวางแผนอาชีพของคุณ', tips: 'โปรดตอบตามสัญชาตญาณและความเป็นจริง โดยจะใช้เวลาประมาณ 5 นาที' },
    'fr': { desc: 'Test des 16 personnalités (MBTI). Évalue vos préférences en termes de perception et de décision pour dessiner votre profil de carrière idéal.', tips: 'Répondez de façon intuitive. Le test prend environ 5 minutes.' },
    'es': { desc: 'Evaluación MBTI de 16 tipos de personalidad. Analiza tus preferencias de percepción y toma de decisiones para perfilar tu vocación y carrera.', tips: 'Responde basándote en tu intuición y realidad. Tardarás unos 5 minutos.' },
    'de': { desc: 'MBTI 16-Persönlichkeitstest. Analysiert Ihre Präferenzen in der Energieausrichtung, Wahrnehmung und Entscheidungsfindung für Ihre Karriere.', tips: 'Antworten Sie intuitiv und ehrlich. Der Test dauert etwa 5 Minuten.' },
    'ko': { desc: '16가지 성격 유형 및 직업 적성 검사 (MBTI). 성격 문항 평가를 통해 자신의 인지 유형 및 행동 성향을 분석하고 성격 보고서와 진로 솔루션을 제공합니다.', tips: '솔직하고 직관적으로 답변해 주세요. 검사에는 약 5분 정도 소요됩니다.' }
  },
  [AppSection.DEPRESSION_TEST]: {
    'zh-CN': { desc: '抑郁自测与心理健康自评估，采用国际标准的 SDS、PHQ-9 抑郁筛查量表，客观计算您的心理压力指数，提供专业心理干预和减压指南。', tips: '所有测评数据严格保密，请根据您最近两周的真实身心体验回答。' },
    'zh-TW': { desc: '抑鬱自測與心理健康自評估，採用國際標準的 SDS、PHQ-9 抑鬱篩查量表，客觀計算您的心理壓力指數，提供專業心理干預和減壓指南。', tips: '所有測評數據嚴格保密，請根據您最近兩周的真實身心體驗回答。' },
    'en': { desc: 'Depression screening and mental health self-assessment. Based on standard clinical scales (PHQ-9) to measure emotional pressure index.', tips: 'Data is strictly confidential. Answer based on your feelings during the last two weeks.' },
    'vi': { desc: 'Tự đánh giá trầm cảm và sức khỏe tinh thần. Sử dụng thang đo sàng lọc tiêu chuẩn quốc tế PHQ-9 để đo lường chỉ số căng thẳng cảm xúc khách quan.', tips: 'Mọi thông tin được bảo mật tuyệt đối. Hãy trả lời dựa trên trải nghiệm thực tế 2 tuần qua.' },
    'ja': { desc: 'うつ自己診断およびメンタルヘルス自己評価。世界基準のうつ病スクリーニング尺度（PHQ-9）を用いてストレス指数を測定し、ケア方法をアドバイス。', tips: '回答データは厳重に保護されます。ここ2週間の心身の状況に基づいてお答えください。' },
    'th': { desc: 'แบบทดสอบภาวะซึมเศร้าและการประเมินสุขภาพจิตเบื้องต้น อ้างอิงจากเกณฑ์คัดกรองมาตรฐานสากล (PHQ-9) เพื่อวัดระดับความตึงเครียดทางอารมณ์ของคุณอย่างตรงไปตรงมา', tips: 'ข้อมูลทั้งหมดจะถูกเก็บเป็นความลับสูงสุด โปรดตอบตามความรู้สึกจริงในช่วงสองสัปดาห์ที่ผ่านมา' },
    'fr': { desc: 'Dépistage de la dépression et auto-évaluation. Utilise les échelles cliniques standards (PHQ-9) pour mesurer l\'indice de stress et conseiller des aides.', tips: 'Données strictement confidentielles. Répondez selon votre ressenti des deux dernières semaines.' },
    'es': { desc: 'Autoevaluación de salud mental y depresión. Utiliza escalas clínicas estandarizadas (PHQ-9) para medir el índice de presión emocional de forma objetiva.', tips: 'Tus datos son estrictamente confidenciales. Responde según te has sentido las últimas dos semanas.' },
    'de': { desc: 'Depressions-Screening und mentale Selbsthilfe. Basiert auf klinischen Skalen (PHQ-9), um den emotionalen Belastungsindex zu messen.', tips: 'Ihre Daten werden vertraulich behandelt. Antworten Sie basierend auf den letzten zwei Wochen.' },
    'ko': { desc: '우울증 자가진단 및 마음 건강 자가평가. PHQ-9 우울 척도 설문을 바탕으로 일상의 감정 및 인지 스트레스 지수를 측정하여 심리 가이드를 제안합니다.', tips: '모든 답변은 철저히 비밀로 유지됩니다. 최근 2주 동안 느꼈던 솔직한 마음 상태에 따라 대답해 주세요.' }
  },
  [AppSection.MARRIAGE_ANALYSIS]: {
    'zh-CN': { desc: '八字姻缘合婚与缘分配对测算，结合八字干支相生相克、生肖冲合、日柱神煞，剖析双方个性碰撞，预测婚姻和谐度与相处之道。', tips: '请输入双方真实的出生时间（标注阳历或阴历）。' },
    'zh-TW': { desc: '八字姻緣合婚與緣份配對測算，結合八字乾支相生相剋、生肖衝合、日柱神煞，剖析雙方個性碰撞，預測婚姻和諧度與相處之道。', tips: '請輸入雙方真實的出生時間（標註陽曆或陰曆）。' },
    'en': { desc: 'Auspicious Marriage and fate analysis. Powered by birth horoscope calculations to forecast compatibility and personality resonance in relationships.', tips: 'Please enter the birth horoscopes (dates and times) of both individuals.' },
    'vi': { desc: 'Xem bói duyên phận và hợp hôn bát tự. Kết hợp ngũ hành tương sinh tương khắc để phân tích tính cách hai bên và dự báo độ hòa hợp trong hôn nhân.', tips: 'Vui lòng nhập ngày giờ sinh thực tế của cả hai người (dương lịch hoặc âm lịch).' },
    'ja': { desc: '相性・夫婦関係の運勢判断。生年月日から互いの陰陽五行の相性や十二支の調和を解析し、二人の関係性と調和の取り方をアドバイス。', tips: 'お二人の正確な生年月日と誕生時間（陽暦または陰暦）を入力してください。' },
    'th': { desc: 'วิเคราะห์ดวงคู่ครองและความเข้ากันได้ของชีวิตสมรส คำนวณความสัมพันธ์ของดวงชะตาตามวันเกิดของทั้งสองฝ่ายเพื่อพยากรณ์เคมีและการครองคู่ร่วมกัน', tips: 'โปรดกรอกข้อมูลวันเกิดและเวลาเกิดที่ถูกต้องของทั้งสองฝ่าย (ระบุสุริยคติหรือจันทรคติ)' },
    'fr': { desc: 'Compatibilité de mariage et de vie commune. Basé sur les profils astrologiques pour analyser la résonance des traits et prévoir l\'harmonie de l\'union.', tips: 'Veuillez saisir les dates et heures de naissance des deux partenaires.' },
    'es': { desc: 'Análisis de compatibilidad matrimonial. Basado en el horóscopo natal para pronosticar la armonía de la pareja y consejos para la convivencia.', tips: 'Por favor, introduce las fechas y horas de nacimiento de ambos miembros.' },
    'de': { desc: 'Ehe-Kompatibilitätsanalyse. Nutzt Geburtsdaten, um die Harmonie in der Partnerschaft und die gegenseitige Resonanz zu bestimmen.', tips: 'Bitte geben Sie die Geburtsdaten und -zeiten beider Partner ein.' },
    'ko': { desc: '사주 인연 및 궁합 분석. 두 사람의 사주 오행 상생상극, 일주 신살 등을 조율하여 결혼 조화도와 서로 어울리는 대화법을 제안합니다.', tips: '궁합을 분석할 두 사람의 정확한 생년월일시(음력/양력 구분)를 입력해 주세요.' }
  },
  [AppSection.WEALTH_ANALYSIS]: {
    'zh-CN': { desc: '个人财运数理测算，结合八字喜用神与大运流年流转，量化一生财富格局、财路方向，助您洞悉求财吉时与守财智慧。', tips: '请输入您的阴历或阳历生日，若出生时间不详可选择“吉时”。' },
    'zh-TW': { desc: '個人財運數理測算，結合八字喜用神與大運流年流轉，量化一生財富格局、財路方向，助您洞悉求財吉時與守財智慧。', tips: '請輸入您的陰曆或陽曆生日，若出生時間不詳可選擇“吉時”。' },
    'en': { desc: 'Personal Fortune and Wealth analysis. Evaluate your lifetime wealth potential, career directions, and financial cycles based on birth horoscopes.', tips: 'Please enter your birth date and time. Select "Unknown" if you do not know the hour.' },
    'vi': { desc: 'Xem tài lộc bát tự cá nhân. Kết hợp hỷ dụng thần và vận hạn từng năm để lượng hóa cơ hội phát tài, định hướng nghề nghiệp thu hút tiền tài.', tips: 'Nhập ngày giờ sinh của bạn (dương lịch hoặc âm lịch), nếu không rõ chọn "Giờ lành".' },
    'ja': { desc: '個人財運・キャリア分析。生年月日からライフサイクルごとの財運パターンを算出し、チャンスとなる時期や資産管理のアドバイスを提示。', tips: '生年月日を入力してください。出生時間が不明な場合は「不明」を選択できます。' },
    'th': { desc: 'วิเคราะห์ดวงการเงินและโชคลาภส่วนบุคคล คำนวณช่วงเวลาการทำมาหากิน โอกาสทอง และทิศทางการเงินตามเกณฑ์ชะตาจากวันเกิดของคุณ', tips: 'โปรดกรอกวันเกิดและเวลาเกิดของคุณ หากไม่ทราบเวลาให้เลือก "เวลาอันเป็นมงคล"' },
    'fr': { desc: 'Analyse de fortune et réussite financière. Évalue le potentiel d\'abondance de votre vie et propose les périodes propices pour investir.', tips: 'Veuillez saisir votre date et heure de naissance. Sélectionnez "Inconnu" si besoin.' },
    'es': { desc: 'Análisis de riqueza y fortuna financiera. Evalúa tu potencial económico y ciclos financieros de tu vida según tu fecha de nacimiento.', tips: 'Introduce tu fecha y hora de nacimiento. Selecciona "Desconocida" si no sabes la hora.' },
    'de': { desc: 'Persönliche Finanz- und Wohlstandsanalyse. Berechnet Ihre finanziellen Potenziale und Erfolgszyklen anhand Ihrer Geburtskonstellation.', tips: 'Bitte geben Sie Ihr Geburtsdatum und Ihre Geburtszeit an.' },
    'ko': { desc: '개인 재물운 사주 분석. 타고난 재물 그릇 크기와 대운/세운 흐름을 조율하여, 나에게 적합한 재물 획득 방향과 기회의 타이밍을 짚어드립니다.', tips: '본인의 정확한 생년월일시를 입력해 주세요. 태어난 시간을 모를 경우 "시간 모름"을 체크하세요.' }
  },
  [AppSection.AI_EYE_DIAGNOSIS]: {
    'zh-CN': { desc: 'AI 虹膜与眼诊大健康测评。结合中医脏腑表征眼图理论及现代眼科筛查常识，智能监测虹膜色素、眼白浑浊度等，提示疲劳状态。', tips: '请在明亮光线下拍摄一张清晰、无反光的眼部细节特写照片。' },
    'zh-TW': { desc: 'AI 虹膜與眼診大健康測評。結合中醫臟腑表徵眼圖理論及現代眼科篩查常識，智慧監測虹膜色素、眼白渾濁度等，提示疲勞狀態。', tips: '請在明亮光線下拍攝一張清晰、無反光的眼部細節特寫照片。' },
    'en': { desc: 'AI Eye and Iris health analysis. Synthesize wellness indicators from eye sclera color and iris textures to estimate fatigue levels.', tips: 'Ensure no direct glare on the eyes and upload a clear, focused close-up photo of one eye.' },
    'vi': { desc: 'Xem mắt đoán sức khỏe AI. Kết hợp lý thuyết ngũ luân bát quái đông y và sàng lọc nhãn khoa để phát hiện độ mỏi mắt, sắc tố củng mạc.', tips: 'Tải lên ảnh chụp cận cảnh chi tiết mắt rõ nét, không bị lóa sáng.' },
    'ja': { desc: 'AI眼診・虹膜健康チェッカー。東洋医学の五輪学説や現代のアイケア知識に基づき、強膜の色や虹彩の質感から疲れ目を測定します。', tips: '明るい光の下で、光の反射がない鮮明な目のアップ写真を撮影してください。' },
    'th': { desc: 'วิเคราะห์สุขภาพดวงตาด้วย AI ตรวจจับสีของตาขาวและลักษณะม่านตาเพื่อบ่งบอกถึงสภาวะความอ่อนล้าตามหลักวิเคราะห์ทางกายภาพ', tips: 'โปรดถ่ายรูปดวงตาด้านหนึ่งในระยะใกล้ที่ชัดเจนและไม่มีแสงสะท้อนโดยตรง' },
    'fr': { desc: 'Analyse oculaire IA. Évalue les indicateurs de fatigue en observant la sclérotique et l\'iris à partir de théories d\'observations oculaires.', tips: 'Prenez une photo de près de l\'œil très nette, sans reflet direct sous un bon éclairage.' },
    'es': { desc: 'Diagnóstico ocular IA. Analiza las características de la esclerótica e iris para evaluar niveles de fatiga y dar recomendaciones de cuidado.', tips: 'Toma una foto de primer plano de un ojo muy clara y sin reflejos de luz directos.' },
    'de': { desc: 'KI-Augendiagnose. Analysiert die Sklerafarbe und Irisstruktur, um Müdigkeit und Belastung der Augen einzuschätzen.', tips: 'Laden Sie ein scharfes Nahaufnahmefoto eines Auges ohne direkte Lichtreflexionen hoch.' },
    'ko': { desc: 'AI 안구 피로도 자가진단. 한의학의 안진법 및 현대 안구 건강 지표를 접목하여 공막의 색상 및 피로도를 측정해 드립니다.', tips: '눈동자에 조명 반사가 심하지 않도록 주의하여 한쪽 눈만 선명하게 찍은 사진을 올려주세요.' }
  },
  [AppSection.EQ_TEST]: {
    'zh-CN': { desc: '情商（EQ）自测评估，结合人际敏感度、自我控制、移情沟通等心理健康指标，深度扫描您的社交与情绪智慧，为您出具分析建议。', tips: '请根据您日常生活中的习惯和真实反应答题，共包含 20 道选择题。' },
    'zh-TW': { desc: '情商（EQ）自測評估，結合人際敏感度、自我控制、移情溝通等心理健康指標，深度掃描您的社交與情緒智慧，為您出具分析建議。', tips: '請根據您日常生活中的習慣和真實反應答題，共包含 20 道選擇題。' },
    'en': { desc: 'Emotional Quotient (EQ) evaluation. Analyze social awareness, self-regulation, and interpersonal communication habits to map your emotional intelligence.', tips: 'Please answer all 20 multiple-choice questions based on your daily behavior.' },
    'vi': { desc: 'Đánh giá trí tuệ cảm xúc (EQ). Phân tích khả năng tự kiểm soát, đồng cảm và giao tiếp xã hội để vẽ nên bản đồ trí tuệ cảm xúc của bạn.', tips: 'Vui lòng trả lời 20 câu hỏi trắc nghiệm dựa trên thói quen phản ứng hàng ngày.' },
    'ja': { desc: '感情指数テスト（EQ）。自己制御力、他者理解力、コミュニケーション力などの要素から、あなたの心の知能指数を測定しアドバイス。', tips: '日常の習慣や実際のリアクションに基づいて回答してください。全20問です。' },
    'th': { desc: 'แบบทดสอบความฉลาดทางอารมณ์ (EQ) วิเคราะห์ความอ่อนไหวทางสังคม การควบคุมตนเอง และทักษะการสื่อสารเพื่อสร้างแผนภาพความฉลาดทางอารมณ์ของคุณ', tips: 'โปรดตอบคำถามปรนัยทั้ง 20 ข้อตามพฤติกรรมจริงในชีวิตประจำวันของคุณ' },
    'fr': { desc: 'Évaluation du quotient émotionnel (QE). Analyse l\'empathie, la gestion de soi et la communication interpersonnelle pour évaluer votre intelligence relationnelle.', tips: 'Veuillez répondre aux 20 questions à choix multiples selon vos habitudes quotidiennes.' },
    'es': { desc: 'Evaluación del Cociente Emocional (EQ). Analiza la autorregulación, empatía y habilidades interpersonales para trazar tu mapa de inteligencia emocional.', tips: 'Responde las 20 preguntas de opción múltiple según tu comportamiento habitual.' },
    'de': { desc: 'Emotionaler Intelligenztest (EQ). Analysiert Empathie, Selbstregulation und Kommunikationsgewohnheiten zur Messung Ihrer emotionalen Reife.', tips: 'Bitte beantworten Sie alle 20 Fragen basierend auf Ihren alltäglichen Reaktionen.' },
    'ko': { desc: '감성지능 지수(EQ) 테스트. 대인 관계 민감도, 자기 통제력, 공감 능력 등의 심리 지표를 조합하여 감성지능 분석과 보완 방향을 제시합니다.', tips: '일상에서 겪는 본인의 성향에 따라 솔직하게 답해 주세요. 총 20문항입니다.' }
  },
  [AppSection.IQ_TEST]: {
    'zh-CN': { desc: '智商（IQ）逻辑与空间思维评测，基于国际通用的瑞文标准推理测验，评估您的图形辨识、类比推理和抽象建模等核心智力维度。', tips: '限时 15 分钟，测试包含 20 道经典的图形逻辑推理题。' },
    'zh-TW': { desc: '智商（IQ）邏輯與空間思維評測，基於國際通用的瑞文標準推理測驗，評估您的圖形辨識、類比推理和抽象建模等核心智力維度。', tips: '限時 15 分鐘，測試包含 20 道經典的圖形邏輯推理題。' },
    'en': { desc: 'Intelligence Quotient (IQ) test. Based on standard Raven\'s progressive matrices to evaluate spatial reasoning and pattern recognition.', tips: 'Limited to 15 minutes. The test contains 20 visual logic reasoning puzzles.' },
    'vi': { desc: 'Đánh giá chỉ số thông minh (IQ). Dựa trên bài kiểm tra suy luận Raven tiêu chuẩn quốc tế để đo lường khả năng tư duy không gian và suy luận hình học.', tips: 'Giới hạn thời gian 15 phút, bài kiểm tra bao gồm 20 câu hỏi tư duy logic hình học.' },
    'ja': { desc: '知能指数テスト（IQ）。国際基準のレイヴン漸進的マトリックスに基づき、図形認識力、論理的推論力、空間把握力を測定します。', tips: '制限時間は15分です。全20問の図形ロジックパズルが含まれています。' },
    'th': { desc: 'แบบทดสอบระดับเชาวน์ปัญญา (IQ) ด้านตรรกะและการคิดเชิงมิติอ้างอิงตามเกณฑ์ทดสอบมาตรฐานประเมินความสามารถในการจดจำแพทเทิร์นและการคิดนามธรรม', tips: 'จำกัดเวลา 15 นาที โดยแบบทดสอบมีคำถามปริศนาตรรกะรูปภาพ 20 ข้อ' },
    'fr': { desc: 'Test de quotient intellectuel (QI). Basé sur le test standard des matrices de Raven pour évaluer le raisonnement logique et la reconnaissance de formes.', tips: 'Limité à 15 minutes. Le test comprend 20 puzzles logiques visuels.' },
    'es': { desc: 'Test de Cociente Intelectual (IQ). Basado en las matrices progresivas de Raven para evaluar razonamiento espacial y reconocimiento de patrones.', tips: 'Tiempo límite de 15 minutos. El test incluye 20 acertijos lógicos visuales.' },
    'de': { desc: 'Intelligenztest (IQ). Basiert auf Astrologie-Matrizentests zur Bewertung der logischen Analysefähigkeit und des räumlichen Denkens.', tips: 'Zeitlimit: 15 Minuten. Der Test enthält 20 visuelle Logikrätsel.' },
    'ko': { desc: '지능지수(IQ) 추론 테스트. 국제 표준 레이븐 매트릭스 추론 검사를 기반으로 공간 지각력, 논리 추론, 수리적 추상화 능력을 복합 측정합니다.', tips: '제한시간은 15분이며, 총 20문항의 도형 논리 추론 문제로 구성되어 있습니다.' }
  },
  [AppSection.BIG_FIVE]: {
    'zh-CN': { desc: '大五人格特质经典测评（NEO-PI），从外向性、宜人性、尽责性、神经质与开放性五个核心轴线，绘制您完整的心理特征全景图。', tips: '请依照真实性格反应，选择与您契合的选项，共包含 20 道情景题。' },
    'zh-TW': { desc: '大五人格特質經典測評（NEO-PI），從外向性、宜人性、盡責性、神經質與開放性五個核心軸線，繪製您完整的心理特徵全景圖。', tips: '請依照真實性格反應，選擇與您契合的選項，共包含 20 道情景題。' },
    'en': { desc: 'Big Five Personality traits test. Map your psyche across Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.', tips: 'Please choose options that reflect your true self. The test has 20 questions.' },
    'vi': { desc: 'Trắc nghiệm tính cách đại ngũ (Big Five). Phác họa chân dung tâm lý của bạn qua 5 yếu tố: Cởi mở, Tận tâm, Hướng ngoại, Dễ chịu và Nhạy cảm.', tips: 'Vui lòng chọn các đáp án thể hiện đúng nhất bản thân. Bài test có 20 câu hỏi.' },
    'ja': { desc: 'ビッグファイブ性格特性分析（NEO-PI）。開放性、誠実性、外向性、協調性、神経症傾向の5つの因子から深層心理をスキャン。', tips: '全20問の状況質問に対し、自分の本当の傾向に最も近い選択肢を選んでください。' },
    'th': { desc: 'แบบทดสอบบุคลิกภาพ Big Five ประเมินตนเองตาม 5 ปัจจัยหลักเพื่อสร้างแผนผังลักษณะทางจิตวิทยาที่ครอบคลุมสำหรับคุณ', tips: 'โปรดเลือกข้อเลือกที่สะท้อนถึงตัวตนที่แท้จริงของคุณ โดยแบบทดสอบมี 20 ข้อ' },
    'fr': { desc: 'Test de personnalité des Big Five. Cartographie votre psyché selon l\'Ouverture, la Conscience, l\'Extraversion, l\'Agréabilité et le Névrosisme.', tips: 'Sélectionnez les réponses qui décrivent le mieux qui vous êtes. 20 questions.' },
    'es': { desc: 'Test de personalidad Big Five. Mide tu perfil psicológico en base a Apertura, Responsabilidad, Extraversión, Amabilidad y Neuroticismo.', tips: 'Elige las opciones que reflejen tu forma de ser real. Consta de 20 preguntas.' },
    'de': { desc: 'Big-Five-Persönlichkeitstest. Misst Ihre Psyche anhand der Faktoren Offenheit, Gewissenhaftigkeit, Extraversion, Verträglichkeit und Neurotizismus.', tips: 'Bitte wählen Sie die Optionen, die am besten zu Ihnen passen. 20 Fragen.' },
    'ko': { desc: '빅 파이브(Big Five) 글로벌 성격 특성 검사. 개방성, 성실성, 외향성, 친화성, 신경증의 5대 핵심 축을 바탕으로 성격 입체 보고서를 구성해 드립니다.', tips: '자신의 평소 행동 경향에 가장 잘 맞는 설문을 터치해 주세요. 총 20문항입니다.' }
  },
  [AppSection.ZI_WEI_DOU_SHU]: {
    'zh-CN': { desc: '紫微斗数传统星盘测算，依托您的出生时辰排布命盘，解析紫微、天府等十四主星在命宫、身宫等十二宫位的落位，推演大限人生格局。', tips: '请输入精准的阴历或阳历生日，以及出生的时辰。' },
    'zh-TW': { desc: '紫微斗數傳統星盤測算，依託您的出生時辰排布命盤，解析紫微、天府等十四主星在命宮、身宮等十二宮位元的落位，推演大限人生格局。', tips: '請輸入精準的陰曆或陽曆生日，以及出生的時辰。' },
    'en': { desc: 'Zi Wei Dou Shu Chinese Horoscope. Renders your destiny chart based on birth date and time, interpreting the 14 major stars in the 12 courts.', tips: 'Please enter your precise birth date and hour of birth.' },
    'vi': { desc: 'Lập lá số Tử Vi Đẩu Số truyền thống. Dựa trên giờ sinh của bạn để an sao bản mệnh, giải mã vị trí 14 chính tinh tại 12 cung số để luận giải đại vận.', tips: 'Vui lòng nhập chính xác ngày giờ sinh (dương lịch hoặc âm lịch).' },
    'ja': { desc: '紫微斗数東洋占星術。生年月日時から命盤を作成し、紫微星をはじめとする十四主星の配置からあなたの本質や運気のバイオリズムを推命。', tips: '正確な生年月日と生まれた時間（時辰）を入力してください。' },
    'th': { desc: 'พยากรณ์ชะตาชีวิตด้วยคัมภีร์สีเวยโต่วซู่ วางผังดวงดาวตามเวลาเกิดของคุณเพื่อวิเคราะห์ตำแหน่งดาวหลักสิบสี่ดวงในสิบสองวังดวงชะตา', tips: 'โปรดกรอกวันเกิด เวลาเกิด และทิศทางดวงชะตาของคุณอย่างถูกต้อง' },
    'fr': { desc: 'Astrologie chinoise Zi Wei Dou Shu. Génère votre thème astral traditionnel pour interpréter la position des 14 étoiles majeures dans les 12 palais.', tips: 'Veuillez renseigner précisément votre date et heure de naissance.' },
    'es': { desc: 'Astrología china Zi Wei Dou Shu. Traza tu mapa astral basándose en tu hora de nacimiento para interpretar las 14 estrellas principales en las 12 casas.', tips: 'Por favor, introduce tu fecha y hora de nacimiento exacta.' },
    'de': { desc: 'Chinesische Astrologie Zi Wei Dou Shu. Erstellt Ihr Geburtsdiagramm zur Deutung der Position der 14 Hauptsterne in den 12 Lebenspalästen.', tips: 'Bitte geben Sie Ihr exaktes Geburtsdatum und Ihre Geburtszeit ein.' },
    'ko': { desc: '전통 자미두수 명반 조회. 명반 작성 기준에 맞는 정확한 날짜 및 탄생 시진 정보를 조합하여 운명의 흐름과 대운을 계산해 드립니다.', tips: '태어난 일시 및 정확한 탄생 시진(시간)을 선택해 주세요.' }
  },
  [AppSection.JADE_APPRAISAL]: {
    'zh-CN': { desc: 'AI 翡翠与玉石智能鉴定。系统学习了数十万张A、B、C货玉石纹理，智能检测矿物晶体结构、表皮颗粒和颜色分布，提供防坑评估参考。', tips: '请上传清晰、高像素的翡翠或玉石局部表面微距细节照片。' },
    'zh-TW': { desc: 'AI 翡翠與玉石智慧鑑定。系統學習了數十萬張A、B、C貨玉石紋理，智慧檢測礦物晶體結構、表皮顆粒和顏色分布，提供防坑評估參考。', tips: '請上傳清晰、高像素的翡翠或玉石局部表面微距細節照片。' },
    'en': { desc: 'AI Jade and Gemstone identification helper. Analyzes mineral crystal structures and color distributions to estimate jade types (Grade A/B/C).', tips: 'Please upload a clear, high-resolution close-up macro photo of the jade surface.' },
    'vi': { desc: 'Giám định cẩm thạch ngọc bích AI. Hệ thống phân tích tinh thể khoáng vật ngọc bích từ hàng chục ngàn mẫu để gợi ý kiểm tra ngọc A, B, C.', tips: 'Tải lên ảnh chụp cận cảnh macro chi tiết rõ nét và có độ phân giải cao bề mặt ngọc.' },
    'ja': { desc: 'AI翡翠・天然石簡易鑑定。数万点に及ぶ翡翠クラス（A・B・C貨）のテクスチャを学習したAIが、結晶構造や着色パターンを画像分析。', tips: '指で石の表面を隠さず、天然石のテクスチャがはっきりと写っている高精細マクロ写真をアップロードしてください。' },
    'th': { desc: 'เครื่องมือช่วยประเมินหยกและอัญมณีด้วย AI วิเคราะห์โครงสร้างผลึกแร่และการกระจายตัวของสีเพื่อประเมินประเภทหยก (เกรด A/B/C) เบื้องต้น', tips: 'โปรดอัปโหลดรูปถ่ายมาโครระยะใกล้ที่มีความละเอียดสูงของพื้นผิวหยก' },
    'fr': { desc: 'Aide à l\'évaluation de Jade par IA. Analyse la structure cristalline et la coloration pour estimer le grade de qualité du jade.', tips: 'Veuillez importer une photo macro très nette de la surface de la pierre.' },
    'es': { desc: 'Identificación de jade IA. Analiza las estructuras minerales y distribución del color de gemas para evaluar su consistencia y transparencia.', tips: 'Sube una foto clara y con gran enfoque en primer plano macro de la superficie del jade.' },
    'de': { desc: 'KI-Smaragd- und Jade-Analyse. Prüft Mineralstrukturen und Farbverteilungen, um Hinweise zur Echtheit und zum Reinheitsgrad zu geben.', tips: 'Laden Sie ein scharfes Makrofoto der Oberfläche des Schmuckstücks hoch.' },
    'ko': { desc: 'AI 비취 및 옥석 감정 진단. 표면 결정구조와 광택 패턴을 기하학적으로 식별하여 옥석 가치 평가 참고 자료를 제공해 드립니다.', tips: '빛 번짐이 심하지 않고 옥의 단면이나 입자가 선명히 보이는 확대 사진을 사용하세요.' }
  }
};

export const INTRO_UI_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  mechanism: {
    'zh-CN': 'AI 分析机制',
    'zh-TW': 'AI 分析機制',
    'en': 'AI Analysis Mechanism',
    'vi': 'Cơ chế phân tích AI',
    'ja': 'AI分析メカニズム',
    'th': 'กลไกการวิเคราะห์ AI',
    'fr': 'Mécanisme d\'analyse IA',
    'es': 'Mecanismo de análisis IA',
    'de': 'KI-Analysemechanismus',
    'ko': 'AI 분석 메커니즘'
  },
  preparations: {
    'zh-CN': '体验准备',
    'zh-TW': '體驗準備',
    'en': 'Preparation Tips',
    'vi': 'Chuẩn bị trải nghiệm',
    'ja': '体験の準備',
    'th': 'การเตรียมตัวก่อนลอง',
    'fr': 'Préparation',
    'es': 'Preparación de la experiencia',
    'de': 'Vorbereitung',
    'ko': '체험 준비'
  },
  start_free: {
    'zh-CN': '开始免费测评',
    'zh-TW': '開始免費測評',
    'en': 'Start Free Evaluation',
    'vi': 'Bắt đầu đánh giá miễn phí',
    'ja': '無料測定を開始',
    'th': 'เริ่มการประเมินฟรี',
    'fr': 'Démarrer l\'évaluation gratuite',
    'es': 'Iniciar evaluación gratuita',
    'de': 'Kostenlose Bewertung starten',
    'ko': '무료 테스트 시작'
  },
  start_test: {
    'zh-CN': '开始测试',
    'zh-TW': '開始測試',
    'en': 'Start Test',
    'vi': 'Bắt đầu kiểm tra',
    'ja': 'テストを開始',
    'th': 'เริ่มทำการทดสอบ',
    'fr': 'Démarrer le test',
    'es': 'Iniciar prueba',
    'de': 'Test starten',
    'ko': '테스트 시작'
  },
  use_credit_desc: {
    'zh-CN': '(消耗 1 点额度)',
    'zh-TW': '(消耗 1 點額度)',
    'en': '(Cost 1 Credit)',
    'vi': '(Tiêu tốn 1 điểm)',
    'ja': '(1クレジット消費)',
    'th': '(ใช้ 1 เครดิต)',
    'fr': '(Consomme 1 crédit)',
    'es': '(Consume 1 crédito)',
    'de': '(Kostet 1 Guthabenpunkt)',
    'ko': '(1 크레딧 소모)'
  },
  aesthetic: {
    'zh-CN': '美学研究',
    'zh-TW': '美學研究',
    'en': 'Aesthetics',
    'vi': 'Nghiên cứu thẩm mỹ',
    'ja': '美学研究',
    'th': 'การศึกษาความงาม',
    'fr': 'Étude esthétique',
    'es': 'Investigación estética',
    'de': 'Ästhetik-Forschung',
    'ko': '미학 연구'
  },
  health: {
    'zh-CN': '健康望诊',
    'zh-TW': '健康望診',
    'en': 'Health Check',
    'vi': 'Kiểm tra sức khỏe',
    'ja': '健康診断',
    'th': 'ตรวจสุขภาพ',
    'fr': 'Bilan de santé',
    'es': 'Consulta de salud',
    'de': 'Gesundheits-Check',
    'ko': '건강 진단'
  },
  metaphysics: {
    'zh-CN': '传统玄学',
    'zh-TW': '傳統玄學',
    'en': 'Metaphysics',
    'vi': 'Huyền học truyền thống',
    'ja': '伝統玄学',
    'th': 'โหราศาสตร์แบบดั้งเดิม',
    'fr': 'Métaphysique',
    'es': 'Metafísica tradicional',
    'de': 'Traditionelle Metaphysik',
    'ko': '전통 명리학'
  },
  psychology: {
    'zh-CN': '心理测评',
    'zh-TW': '心理測評',
    'en': 'Psychology',
    'vi': 'Đánh giá tâm lý',
    'ja': '心理測定',
    'th': 'การประเมินทางจิตวิทยา',
    'fr': 'Évaluation psychologique',
    'es': 'Evaluación psicológica',
    'de': 'Psychologischer Test',
    'ko': '심리 테스트'
  }
};

