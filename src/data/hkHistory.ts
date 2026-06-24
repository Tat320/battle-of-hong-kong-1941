export type SceneTone = 'opening' | 'base' | 'attack' | 'sea' | 'rescue';
export type SceneFocus =
  | 'newTerritories'
  | 'wongMoYing'
  | 'rescue'
  | 'shaTin'
  | 'kaiTak'
  | 'sea'
  | 'harbour'
  | 'wuGauTang'
  | 'kerr'
  | 'postwar';

export interface SceneEntry {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  location: string;
  body: string;
  focus: SceneFocus;
  tone: SceneTone;
  highlights: [string, string][];
  sources?: string[];
}

export interface SourceEntry {
  label: string;
  url: string;
}

export const sourceCatalog: Record<string, SourceEntry> = {
  'chiculture-3048': {
    label: '中華文化：港九大隊抗日活動',
    url: 'https://chiculture.org.hk/tc/photo-story/3048',
  },
  'tkww-20250728': {
    label: '大公文匯：港九大隊敵後抗戰補充資料',
    url: 'https://www.tkww.hk/a/202507/28/AP6886c580e4b0f2e743937bef.html',
  },
  'amo-trail': {
    label: '古蹟辦：東江縱隊香港抗戰遺跡導賞',
    url: 'https://www.amo.gov.hk/filemanager/amo/en/content_2112/gba-dongjiang-column-heritage-trail-ebooklet.pdf',
  },
  '80a-kerr': {
    label: '80aVictory：克爾飛行員藏匿地點',
    url: 'https://www.80avictory.gov.hk/en/site-content.html?id=34',
  },
  'lingnan-scholar': {
    label: '嶺南學者：〈港九獨立大隊史〉',
    url: 'https://scholars.ln.edu.hk/en/publications/%E6%B8%AF%E4%B9%9D%E7%8D%A8%E7%AB%8B%E5%A4%A7%E9%9A%8A%E5%8F%B2/',
  },
  'xinhua-kerr': {
    label: '新華社：Donald W. Kerr 獲救故事',
    url: 'https://www.youngpostclub.com/yp/discover/lifestyle/article/3132756/hong-kong-rescue-us-fighter-pilot-saved-chinese-guerillas',
  },
};

export const scenes: SceneEntry[] = [
  {
    id: 'prelude-1938',
    date: '1938.10.21',
    title: '廣州局局勢轉變，香港成為重要通道',
    subtitle: '華南戰事演變，香港承接人員、物資與情報流動。',
    location: '香港全境／新界口岸',
    body:
      '廣州局勢改變後，香港的通道角色急速上升。面對周邊局勢發展與人口湧入，本地村落、海岸線與市區商業網絡，逐步成為後續交通與聯繫工作的基礎。',
    focus: 'newTerritories',
    tone: 'opening',
    highlights: [
      ['角色轉變', '香港從前線區域轉變為後方通道'],
      ['後續影響', '地下交通、情報與人員往來網絡開始成形'],
      ['相關地帶', '新界口岸、九龍沿岸、港島中環'],
    ],
    sources: ['chiculture-3048', 'lingnan-scholar'],
  },
  {
    id: 'attack-1941-12-08',
    date: '1941.12.08',
    title: '香港戰事爆發',
    subtitle: '太平洋戰爭爆發後，香港防線隨即承受軍事壓力。',
    location: '啟德機場、九龍半島、維港兩岸',
    body:
      '1941年12月8日清晨，香港遭到日軍進攻。機場、海港和防線同時受壓，港九地區陷入變局，這亦為之後的民間抵抗和營救行動埋下背景。',
    focus: 'kaiTak',
    tone: 'attack',
    highlights: [
      ['開戰日期', '1941-12-08'],
      ['受壓位置', '啟德、九龍、港口設施'],
      ['戰略後果', '常規防線改變，抵抗活動轉入地下'],
    ],
    sources: ['chiculture-3048', 'tkww-20250728'],
  },
  {
    id: 'fall-1941-12-25',
    date: '1941-12-25',
    title: '香港進入日佔時期',
    subtitle: '守軍停止抵抗，港九大隊的活動正式展開。',
    location: '港島、九龍及新界',
    body:
      '香港守軍於聖誕日停止抵抗，城市全面落入日軍控制。由這一刻起，本地村民、地下交通人員與華南游擊隊的聯繫，成為日佔時期抵抗活動的重要骨幹。',
    focus: 'harbour',
    tone: 'attack',
    highlights: [
      ['轉折點', '1941-12-25'],
      ['局勢變更', '日本軍政接管香港'],
      ['下一步', '地下聯絡與游擊據點開始運作'],
    ],
    sources: ['chiculture-3048', 'amo-trail'],
  },
  {
    id: 'rescue-1942-01-08',
    date: '1942.01.08',
    title: '秘密營救行動起步',
    subtitle: '由接應、暫居到轉移，救援網開始連成一線。',
    location: '深水埗、西貢、大鵬灣',
    body:
      '賴濂士等人從深水埗集中營逃脫後，獲游擊隊接應並暫避於西貢鄉村學校；其後經企嶺下橫渡大鵬灣，轉移至惠州大後方。這條路線後來延伸成長達十一個月的秘密營救行動。',
    focus: 'rescue',
    tone: 'rescue',
    highlights: [
      ['營救形式', '接應、匿藏、分段護送'],
      ['持續時間', '約 11 個月'],
      ['救援對象', '文化界人士、民主人士、戰俘與盟軍官兵'],
    ],
    sources: ['chiculture-3048', 'tkww-20250728'],
  },
  {
    id: 'rescue-1942-01-09',
    date: '1942.01.09',
    title: '秘密交通線全面啟動',
    subtitle: '村落、船路與市區據點串成一張地下網。',
    location: '銅鑼灣避風塘、紅磡、梅林坳、深圳白石龍',
    body:
      '1942年1月9日，文化界人士由銅鑼灣避風塘乘小艇到紅磡碼頭，再經梅林坳山路轉移至深圳白石龍村。聯絡站、交通員與村民互相掩護，讓轉移路線可以穩定運作。',
    focus: 'rescue',
    tone: 'rescue',
    highlights: [
      ['核心角色', '交通員、村民、游擊隊'],
      ['路線特徵', '陸路接力 + 海路撤離'],
      ['歷史意義', '地下聯絡與救援體系成形'],
    ],
    sources: ['chiculture-3048', 'amo-trail', 'lingnan-scholar'],
  },
  {
    id: 'founding-1942-02-03',
    date: '1942.02.03',
    title: '港九大隊成立',
    subtitle: '在西貢黃毛應村建隊，香港秘密武裝活動正式定型。',
    location: '西貢黃毛應村',
    body:
      '港九大隊在黃毛應村成立後，逐步建立區域分工、情報網、交通線與海上聯絡。它既是地方武裝，也是群眾組織和救援網絡的支點。',
    focus: 'wongMoYing',
    tone: 'base',
    highlights: [
      ['成立日期', '1942-02-03'],
      ['成立地點', '西貢黃毛應村'],
      ['組織功能', '武裝活動、情報、救援、聯絡'],
    ],
    sources: ['chiculture-3048', 'tkww-20250728', 'amo-trail'],
  },
  {
    id: 'massacre-1942-09-25',
    date: '1942.09.25',
    title: '烏蛟騰事件',
    subtitle: '日軍採取搜捕與懲罰行動，凸顯新界根據地的風險。',
    location: '沙頭角烏蛟騰',
    body:
      '烏蛟騰事件是抗戰時期的一段歷史。日軍因村民支援游擊隊而採取嚴厲的搜捕與懲罰行動，反映出港九大隊和地方社群之間的互信，以及當時所承受的代價。',
    focus: 'wuGauTang',
    tone: 'attack',
    highlights: [
      ['事件性質', '日軍針對村民的搜捕與處置行動'],
      ['地點', '烏蛟騰、沙頭角一帶'],
      ['歷史影響', '新界村民承受重大犧牲與損失'],
    ],
    sources: ['chiculture-3048', 'amo-trail'],
  },
  {
    id: 'station-1942-11',
    date: '1942.11',
    title: '「廣恆」雜貨店成為秘密據點',
    subtitle: '商舖、聯絡站與交通點交疊，地下網絡進一步擴張。',
    location: '九龍市區（具體店址待考）',
    body:
      '資料顯示，黃作梅以「廣恆」雜貨店作為市區秘密情報與聯絡站；現有引用資料未能確認可公開核對的精確店址，因此地圖只標示市區代表點。',
    focus: 'newTerritories',
    tone: 'base',
    highlights: [
      ['掩護方式', '商舖、倉庫、平民住所'],
      ['功能', '傳訊、接頭、物資中轉'],
      ['結果', '地下網更難被日軍識破'],
    ],
    sources: ['tkww-20250728', 'lingnan-scholar'],
  },
  {
    id: 'reorg-1943-12-02',
    date: '1943.12.02',
    title: '東江縱隊成立，港九大隊改編',
    subtitle: '港九獨立大隊納入華南抗日游擊體系。',
    location: '華南根據地／香港',
    body:
      '隨著廣東人民抗日游擊隊改編為東江縱隊，港九大隊亦成為其重要部分。這意味著香港的抗戰工作納入華南整體的部署。',
    focus: 'newTerritories',
    tone: 'base',
    highlights: [
      ['整編時間', '1943-12-02'],
      ['隸屬變化', '港九獨立大隊納入東江縱隊'],
      ['戰略層級', '由本地抵抗升格為區域協同'],
    ],
    sources: ['chiculture-3048', 'lingnan-scholar'],
  },
  {
    id: 'kerr-1944-02-11',
    date: '1944.02.11',
    title: '克爾中尉飛機被擊落',
    subtitle: '美軍飛行員在啟德上空受創，跳傘降落九龍觀音山附近。',
    location: '啟德機場上空／九龍觀音山附近',
    body:
      '1944年2月11日，克爾中尉空襲啟德日軍機場時被高射砲擊中，跳傘降落九龍觀音山附近。這宗事件後來引出港九大隊和地方群眾協助盟軍飛行員脫險的轉移故事。',
    focus: 'kerr',
    tone: 'attack',
    highlights: [
      ['日期', '1944-02-11'],
      ['任務背景', '空襲啟德日軍機場'],
      ['後續', '開始牽動地下營救與轉移行動'],
    ],
    sources: ['80a-kerr', 'xinhua-kerr', 'chiculture-3048'],
  },
  {
    id: 'kerr-1944-03',
    date: '1944.02-1944.03',
    title: '克爾獲協助送往東江縱隊司令部',
    subtitle: '由當地人員接力帶路，再由游擊隊護送離港。',
    location: '西貢、土洋村、深圳沿線',
    body:
      '克爾在當地村民與游擊隊協助下得到安置，再沿地下路線轉移至安全地帶。這條救援鏈展示出港九大隊、華南游擊隊與村民之間的協調。',
    focus: 'kerr',
    tone: 'rescue',
    highlights: [
      ['營救形式', '村民接力 + 游擊隊護送'],
      ['重要人物', '克爾、李石等聯絡人員'],
      ['成果', '盟軍飛行員成功脫險並安全轉移'],
    ],
    sources: ['80a-kerr', 'xinhua-kerr', 'chiculture-3048'],
  },
  {
    id: 'bridge-1944-04-21',
    date: '1944.04.21',
    title: '窩打老道鐵路橋受損',
    subtitle: '港九大隊針對交通設施進行破壞。',
    location: '窩打老道／京士柏一帶',
    body:
      '港九大隊在1944年春季多次採取行動，破壞日軍運輸與通訊設施。窩打老道4號鐵路橋受損行動，顯示市區內的游擊活動已涉及敵方後勤線。',
    focus: 'kaiTak',
    tone: 'attack',
    highlights: [
      ['行動日期', '1944-04-21'],
      ['打擊目標', '鐵路與運輸節點'],
      ['戰術意義', '影響敵方後勤與調動'],
    ],
    sources: ['chiculture-3048', 'tkww-20250728'],
  },
  {
    id: 'sea-1944-08-15',
    date: '1944.08.15',
    title: '海上游擊隊與日船交火',
    subtitle: '周邊水域發生衝突，海運補給受到影響。',
    location: '港外水域（具體交戰點待考）',
    body:
      '港九大隊的海上力量在1944年8月15日與日船交火，顯示香港周邊海域同樣屬於游擊活動範圍。海上行動配合陸上破壞，增加了日軍維持補給與控制的難度。',
    focus: 'sea',
    tone: 'sea',
    highlights: [
      ['作戰時間', '1944-08-15'],
      ['戰場', '海面與離島航道'],
      ['成果', '擊沉或重創日船，影響補給'],
    ],
    sources: ['chiculture-3048', 'tkww-20250728'],
  },
  {
    id: 'surrender-1945-08-15',
    date: '1945.08.15',
    title: '日本宣佈投降',
    subtitle: '香港戰事迎來終結，戰後重建工作隨即展開。',
    location: '香港全境',
    body:
      '日本宣佈投降後，香港結束了長期的日佔狀態。港九大隊與地方社群的抗戰歷史開始進入整理階段，而戰後復原和善後問題亦隨之而來。',
    focus: 'postwar',
    tone: 'base',
    highlights: [
      ['終戰日期', '1945-08-15'],
      ['意義', '日佔時期結束'],
      ['後續', '戰後接收與復原工作啟動'],
    ],
    sources: ['chiculture-3048', 'lingnan-scholar'],
  },
  {
    id: 'harcourt-1945-08-30',
    date: '1945.08.30',
    title: '夏慤率艦隊進港',
    subtitle: '英國海軍重新進入香港，主持戰後秩序重建。',
    location: '維多利亞港',
    body:
      '英國海軍少將夏慤率艦隊進港，標誌著香港從日本管治轉向英國重新接管。這亦是港九大隊由秘密狀態走向公開歷史敘述的重要轉折點。',
    focus: 'harbour',
    tone: 'base',
    highlights: [
      ['進港日期', '1945-08-30'],
      ['人物', '夏慤（Admiral Harcourt）'],
      ['歷史位置', '負責戰後接收與重組秩序'],
    ],
    sources: ['chiculture-3048', 'lingnan-scholar'],
  },
  {
    id: 'surrender-1945-09-16',
    date: '1945.09.16',
    title: '投降書正式簽署',
    subtitle: '香港戰時管治正式結束，相關歷史進入整理與回顧階段。',
    location: '香港總督府（今禮賓府）',
    body:
      '9月16日，日軍代表在香港總督府正式簽署投降文件。對港九大隊來說，這代表戰事正式落幕，也是長年秘密活動得以公開回顧的起點。',
    focus: 'postwar',
    tone: 'base',
    highlights: [
      ['正式程序', '簽署投降書'],
      ['時間', '1945-09-16'],
      ['後果', '香港戰時篇章正式落幕'],
    ],
    sources: ['chiculture-3048'],
  },
  {
    id: 'martyrs-1998-12-28',
    date: '1998.12.28',
    title: '烈士名冊安放儀式',
    subtitle: '戰後數十年，犧牲者與歷史貢獻進入公共紀念範疇。',
    location: '香港大會堂',
    body:
      '1998年，烈士名冊在香港大會堂安放，代表港九大隊的歷史記憶正式納入公共紀念與歷史保存層面。這一步讓這段抗戰歷史成為可供查考與展示的城市歷史檔案。',
    focus: 'postwar',
    tone: 'base',
    highlights: [
      ['日期', '1998-12-28'],
      ['性質', '烈士名冊安放儀式'],
      ['意義', '抗戰記憶進入公共紀念與歷史保存'],
    ],
    sources: ['tkww-20250728', 'lingnan-scholar'],
  },
];
