/** O181. 43 original source-frame identities copied from independently audited O136/O137 Python reports.
 * Cryptographic source-frame witness: browser exporter MUST rehash all indexed, opacity,
 * and RGBA planes; callers cannot feed altered in-memory source frames to O177.
 * These values prove ORIGINAL source pixels, not gameplay palette/timing/position.
 */
import type {O136EffectFrame} from './stageOriginalEffectFramesO136.ts';
export interface SourceFrameWitnessO181 {w:number;h:number;x:number;y:number;d:number;a:number;b:number;index:string;mask:string;rgba:string}
export const ORIGINAL_FRAME_WITNESSES_O181:Readonly<Record<string,readonly SourceFrameWitnessO181[]>> = {
 "tomb_flying_a": [
  {
   "w": 41,
   "h": 25,
   "x": -3,
   "y": 7,
   "d": 96108,
   "a": 60124,
   "b": 60520,
   "index": "21c3f33497e61f0da814d3421b6ff39d73dc5997c177c827ff74d4b20eb632fc",
   "mask": "d7d125db08ca6c61e1d7a4f7a6ca34bfa7d7ed13ea98719c86f0e8928d4a3a0e",
   "rgba": "c7420844885d284fdefe0f7d88de9568d5edf4bf6f8c945f5a127d9301e697d0"
  },
  {
   "w": 41,
   "h": 25,
   "x": -3,
   "y": 8,
   "d": 96124,
   "a": 60520,
   "b": 60984,
   "index": "39d2c5e3965d15ba5dcc4652238c243fbf6fa9bec36f65ed2a1e0b16d70a051b",
   "mask": "276228a17cdef5e8bab9d6873e14dc190b35134e3d3a08988eb4e232f5c04c08",
   "rgba": "2713d627aa798fc67e843cfb5b76b9cce940921496008eb1c2e4716b214673a4"
  },
  {
   "w": 41,
   "h": 25,
   "x": -4,
   "y": 11,
   "d": 96136,
   "a": 60984,
   "b": 61476,
   "index": "a8947f202d1d3c71461f6851c29b406ce243c2fa0e2e3aeedce258c1fbd9b3d9",
   "mask": "17059fcb24076bcece2c4571c6c60db3ad4f0520fac32aba2812fddb6d4a2ee6",
   "rgba": "127bb539e5ac606bb98708f8200547fc57ead3c1e6a0da2299682e8506ff3c97"
  },
  {
   "w": 41,
   "h": 25,
   "x": -6,
   "y": 13,
   "d": 96148,
   "a": 61476,
   "b": 61952,
   "index": "58cf800707007f026788aefb8eb24a1fdc6803d52eed6eb245c7ae27a8fe19d2",
   "mask": "1e218c072274954d82801ab988c2a11c5c84d121794a1c38d86d286d18dc1674",
   "rgba": "015b049ee571ae055b7fc6e808712585c0b3dffb34e7dcb312980ab2c9537272"
  },
  {
   "w": 41,
   "h": 25,
   "x": -6,
   "y": 15,
   "d": 96160,
   "a": 61952,
   "b": 62392,
   "index": "5991ab8f18b56a7030529fc4cbbaf135378e330c0b101c81fd4119ba3e2e3ee4",
   "mask": "637ccda431c762438724249fd02604f89aba0e9a52e611b74f5d3752d913daa9",
   "rgba": "58281bd9f3e222e5e9aa0298594db743a3cb3838a76a5a0ba0f12fc5316603bc"
  },
  {
   "w": 41,
   "h": 25,
   "x": -8,
   "y": 19,
   "d": 96172,
   "a": 62392,
   "b": 62880,
   "index": "4dd5f6d89505a9501e97ce09c7ec69611c76e7ce8332be2ab6f905e317d2b51f",
   "mask": "83d37a555d66fcd369ce7558ea911d5cf1464cdf89b9b34a188186e27391b06a",
   "rgba": "590280e89eae954e2d833daf01f43555e434e946958f40e2969f615bc6100e42"
  },
  {
   "w": 41,
   "h": 25,
   "x": -9,
   "y": 14,
   "d": 96184,
   "a": 62880,
   "b": 63380,
   "index": "42d7630a5db0f463099a222cde137172f5e66a41a959b186c04c61eff7652b44",
   "mask": "bf3713d43137172023f3901ba04afdb77104b9ccf837183dc020ae23e6b7eb89",
   "rgba": "bdba0641626d738f760113b032120d52b682d647fd0ffc8eb351c7fdbf87e1a4"
  },
  {
   "w": 41,
   "h": 25,
   "x": -6,
   "y": 6,
   "d": 96196,
   "a": 63380,
   "b": 63776,
   "index": "6c5f600d25feb3d6c98812471f5a866f8737042c2b9f7eda24f2ba95ca7fd3fb",
   "mask": "0e87f8a3e6057e882bf76b0fe0ff17b03754c063a4e50fe6b6f6652b72f355be",
   "rgba": "50b1fed42d529f8197b1051fb0f9b63e6f7a2f6a34e0aa57968862ad34eff783"
  }
 ],
 "tomb_flying_b": [
  {
   "w": 49,
   "h": 25,
   "x": -3,
   "y": 11,
   "d": 96008,
   "a": 54328,
   "b": 54888,
   "index": "934fc27ece48517094f8c49554a8e1f149983d6cca1a6db49430c6b983fddf62",
   "mask": "1287dee7e1d4963e03e5d8659252ad60e4af2af3a06094fef99e5530f95f42ce",
   "rgba": "2651147e5d75b418787495415c055cb0a8c7e2a5a21e48bfc60236873094ea77"
  },
  {
   "w": 49,
   "h": 25,
   "x": -3,
   "y": 11,
   "d": 96024,
   "a": 54888,
   "b": 55600,
   "index": "c791ada5ab6cdc600c64c4e983e18dbf422aaeb416778cf8d7291b840d08e642",
   "mask": "7560877c0c0319df1dc25761a6d94a5fe8fa54e39aa4d1780070ca565eeaa883",
   "rgba": "f9d895c925b462060bc4db5860cd0988ff0f1a82bae353750fee71f0659ea79f"
  },
  {
   "w": 49,
   "h": 25,
   "x": -5,
   "y": 15,
   "d": 96036,
   "a": 55600,
   "b": 56388,
   "index": "0b429b7e5572e691af83006301c0bb19e089ae17b8ae484149fd45f0b791d9e8",
   "mask": "3c43e2210800b24d2ee71d9d479256f3e5b230557b53d7f79457f5fa22846730",
   "rgba": "f3c1c9f0394a1e894b38170b3ea71ac7aea7c2555d82e9c3a50e5d6db67d9da4"
  },
  {
   "w": 49,
   "h": 25,
   "x": -6,
   "y": 18,
   "d": 96048,
   "a": 56388,
   "b": 57260,
   "index": "a63656615f52eee868224bfd6d083bb094e8212a9c8925a26bc0da948beb2ec7",
   "mask": "a51e505c213f2286cce0cae4acfc5168703bcc5695a3853f22e3c4c92fa81c5e",
   "rgba": "368281e2914e883ddb174f84b33a9bf021d9c0ca3aaa3d88870f711de8cea0b7"
  },
  {
   "w": 49,
   "h": 25,
   "x": -7,
   "y": 22,
   "d": 96060,
   "a": 57260,
   "b": 57920,
   "index": "4d0f0e1814583a94f30698426bebb93f8a46ec97c4c510d47c6e0c296b5cdb43",
   "mask": "b75338294104caa212d3a100b0061710f1063d25abd9408aa8149dcffb13fac9",
   "rgba": "148a9ea517342ee41e80b8951b014ebe2c75951969104b01993244077b442bc9"
  },
  {
   "w": 49,
   "h": 25,
   "x": -8,
   "y": 28,
   "d": 96072,
   "a": 57920,
   "b": 58708,
   "index": "c6dd765187cca01500653fd87453e20402fb8240d0ae86c47f92c8387cd6cbdd",
   "mask": "816a5976962a28b6d9a85978c4d5b1869d2bda422354a05a516c5c18009bdd9c",
   "rgba": "60cc0540a787cdb989301a2e235fda10cc38f164d8ae65ba198366759bd49095"
  },
  {
   "w": 49,
   "h": 25,
   "x": -7,
   "y": 22,
   "d": 96084,
   "a": 58708,
   "b": 59496,
   "index": "4300f95e639c5b01227db04a486a633c1e2f9e0d980d85710d6916143a72c785",
   "mask": "c80b875ded3708bea1c320794cd5aecf99388317b385f0eaff13b40b55374139",
   "rgba": "5133849a42fb1cf3ea8f86f4c08d665a9aa05086343854fb9e5229f7eeaf8418"
  },
  {
   "w": 49,
   "h": 25,
   "x": -5,
   "y": 8,
   "d": 96096,
   "a": 59496,
   "b": 60124,
   "index": "2445b00c9539f2a2e6236f1b9492a84da6231c474ad77eb85640ff01b205d3a6",
   "mask": "4ecc0b47bde983fb22b579068232228411df0ccffaf1514734ff57b9878c6e70",
   "rgba": "e0d17c7e4b03b895d86f62c59696bfa87816eea27cdf1c90fc58a437bd146ab7"
  }
 ],
 "portal_swaying": [
  {
   "w": 41,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91588,
   "a": 35912,
   "b": 38112,
   "index": "9a9e3693d918d66fbccce3aca86dc5fe5eb99d5c020f557b77ffc868353b37b1",
   "mask": "21909ce120ad153097f32f67318b0bef2cdf8a8bcdffd6752d6cf4a9bbd01e6a",
   "rgba": "0314e9641ac21c0243cf787f233ab7666572a0550635b70a27d7672a32378071"
  },
  {
   "w": 38,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91604,
   "a": 38112,
   "b": 40296,
   "index": "c5e9f9e4644f628939f66c4c19bb3d383fc175523bedd6196730275ed39262f3",
   "mask": "0c4103c8920f85decef15ccbcc28f29d57bc563ba7702ea24f3f30fa4d5189e7",
   "rgba": "4ab90f9920d949e8df9c06f0d7039d4c8c08476609d14fdfbc1aeadb81f3a879"
  },
  {
   "w": 37,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91616,
   "a": 40296,
   "b": 42480,
   "index": "b1e399992495ca1c88d23a9c92f5f3717581e4f1983b9af12dff702d86b349fd",
   "mask": "af58feb63136ff33285d1e0cb693845aefcc0284aec53a0bb5e1aa5e01bc1f99",
   "rgba": "2d9c14db7f3d241e1052f33ae18ae2bf8c67fa37b91519ad11bd1c37531d55d5"
  },
  {
   "w": 38,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91628,
   "a": 42480,
   "b": 44672,
   "index": "b065d9e932cbd39794afdd9f54b48d92bf88b41501e5862bce7e156eddc3e6f0",
   "mask": "41acfa94d882edf039f058b421593ea7d9f9d47ae20b09d622313af6ed759baf",
   "rgba": "407f1e300401b3a411f42d114136d873de87400b7ec163c0eae9f0c64f21b622"
  },
  {
   "w": 39,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91640,
   "a": 44672,
   "b": 46900,
   "index": "f306e30d4384caf0e40fad55cdf4742c7892640452cbf59b1f0fb75826be280d",
   "mask": "8aa6c9ab0bd6133937ce205c11b9a164883e437eff9812aab246943dbdddf20f",
   "rgba": "257c4e6e561c799df172f3b8f7a98b42cd720ccac6a791362e3bc41c83ca5b34"
  },
  {
   "w": 41,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91652,
   "a": 46900,
   "b": 49160,
   "index": "5ab085ec93455458292a0d5c118573e30ccd528637426bb2497ce48e7b51c1d2",
   "mask": "8f236cc985300568993a65185937fe86a3f0ab68c2f2bfb9edc8c50cb2acd342",
   "rgba": "fd7d9fdcc1541dfc8bc3293514fd93d7d2898c08af150fab4c28e3b77909770e"
  },
  {
   "w": 42,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 91664,
   "a": 49160,
   "b": 51408,
   "index": "7f282049382917a8007801dd20d9d88cc04c3713edfa00f4c438fb7f6346c9b3",
   "mask": "38875163c8b4b7ef3310dd5d6798509e713084762feae4fdc36c6969c6d1efc6",
   "rgba": "a47b34494a28e309814db550993c6066171452deed1127bd50bcd39c978f289e"
  }
 ],
 "portal_hanging": [
  {
   "w": 14,
   "h": 24,
   "x": -10,
   "y": -13,
   "d": 91676,
   "a": 51408,
   "b": 52040,
   "index": "88c084025c537684b39b46ec76059bae511490ada9986f50f414c1ae2cdf0eb2",
   "mask": "4cbd85d8565b71a2f30d877d6063189bf1a4eed7b754302d1405e826f038e8d7",
   "rgba": "4d80ae6601e27efd95a5b52ab9d89d1908f83b15e1a5f9c2c9309a41f1a55753"
  },
  {
   "w": 14,
   "h": 24,
   "x": -10,
   "y": -13,
   "d": 91692,
   "a": 52040,
   "b": 52668,
   "index": "4cbf6dc1108c729444ab827aa64a4b7dcbac20fffc36bc0970445710912c6587",
   "mask": "f03780945d7c280b73dd340ad0cf48f492274a957c842b076d0c82b881f2e619",
   "rgba": "41f1c5c3d859c3b86017d8bf35490e67461a50511c631d62982e2ab5e2d7101e"
  },
  {
   "w": 14,
   "h": 24,
   "x": -10,
   "y": -13,
   "d": 91704,
   "a": 52668,
   "b": 53304,
   "index": "2881883f6422869244f69ee026d81023f877cdbfae4b8a54f267c440200a3baf",
   "mask": "154be675c848b9b53382b24c2faad7a1f5a772387ed1cba2e93e89b9856e5ab2",
   "rgba": "68591ff6205e56ab95a338ebbc43db798a1aba6f2134f268c8ae7c9b66501d6f"
  },
  {
   "w": 13,
   "h": 23,
   "x": -10,
   "y": -13,
   "d": 91716,
   "a": 53304,
   "b": 53900,
   "index": "9787a8e61bc116dbf4b22e7fb4d90e7f93bc7b4e0617c0a062fe7aa7d70dfb47",
   "mask": "26f8c173e5fe262508f040241e7adc8c10c3f9db8cf40e406f9b8f7b7a145058",
   "rgba": "e71289ebad7039d119d7ea3affb79a2924898d3d47f8fbeb2f4e07f762ec7346"
  },
  {
   "w": 14,
   "h": 24,
   "x": -10,
   "y": -13,
   "d": 91728,
   "a": 53900,
   "b": 54520,
   "index": "f558f0e09fd16c6b0810ee0e0db4f485c6c03034b06fb3ebd712c3816f65df26",
   "mask": "013a1a9685b4eb7bfe61440cf72aac3d979c06199db8c03b40f29dbd115154b4",
   "rgba": "3cd1dfbefddcfc3841fa4b21c751a58b9e9d8f2064b61ef52dd1921e8322727d"
  },
  {
   "w": 15,
   "h": 24,
   "x": -10,
   "y": -13,
   "d": 91740,
   "a": 54520,
   "b": 55152,
   "index": "61fa4a68ffcdd4a9d054ece81a4a88ad3bd3fa2acf1d2bacbd34823ec1765c3e",
   "mask": "813423984e174d29490aaf1b40c7f4e9c639795ad5f2a0a26cf004f397ecea23",
   "rgba": "b22dafffa9ea12e78e9186643c289523a573a8fc496501f262e2ba7a47e9a9fa"
  },
  {
   "w": 15,
   "h": 24,
   "x": -10,
   "y": -13,
   "d": 91752,
   "a": 55152,
   "b": 55780,
   "index": "2b8c0f1f3d352e5cae0dea51de4880f864f0f4839ed82295320d7ddedadbb344",
   "mask": "efece5f7af317b49fc8e5ea95716c54ba51948c95e3cc24f968065ae922d1d69",
   "rgba": "bd110d6e2d2ab43fc8bd5c4cee024fc171fdc65fe480d22397a30a171a36ab1e"
  }
 ],
 "portal_electric": [
  {
   "w": 21,
   "h": 14,
   "x": 0,
   "y": 0,
   "d": 91764,
   "a": 55780,
   "b": 55936,
   "index": "0f806d899a31e5eb2426ba09e03718a07fd256a2c5248551b5628067b79f858c",
   "mask": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5",
   "rgba": "18391c9cebd020634bd64e67eba532748577350e26c3f626922d9f6aefdc197c"
  },
  {
   "w": 21,
   "h": 14,
   "x": 0,
   "y": 0,
   "d": 91780,
   "a": 55936,
   "b": 56124,
   "index": "9791f1e1a7c3ad6f68f948171081a5ab7a523768c492778fc14eb115216d75e1",
   "mask": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5",
   "rgba": "b0a1e97bd995ac7dee7500c4988b4532ec7d4470a2af52aded5d2af07b008d06"
  },
  {
   "w": 21,
   "h": 14,
   "x": 0,
   "y": 0,
   "d": 91792,
   "a": 56124,
   "b": 56316,
   "index": "cb5943ad2de14bbfeaa4ceec553c0dc78e46845a68b809cca7f196b2dac0ae21",
   "mask": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5",
   "rgba": "4966116b3203d832b13e27cc2333e449b781bee54a63269fa05bbd14b43d4d84"
  },
  {
   "w": 21,
   "h": 14,
   "x": 0,
   "y": 0,
   "d": 91804,
   "a": 56316,
   "b": 56544,
   "index": "0d24fac502ac6279928ce6b030d126172ab68f41d11781604e4e1c954c0e7be1",
   "mask": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5",
   "rgba": "7aacd714a01ea7aadd2cba2d0bbe3728af63bcf96d1231e4ebc35c3376b305a4"
  },
  {
   "w": 21,
   "h": 14,
   "x": 0,
   "y": 0,
   "d": 91816,
   "a": 56544,
   "b": 56736,
   "index": "718e39a84fbe24934dc0721a6276363c7e5ef4fb377a5a78b8e7d2ecab7c308d",
   "mask": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5",
   "rgba": "142f48236a4687f7ca7c255ef6fbcd0da80aff2ce019e414b19feadf8fdffc3a"
  },
  {
   "w": 21,
   "h": 14,
   "x": 0,
   "y": 0,
   "d": 91828,
   "a": 56736,
   "b": 56916,
   "index": "0ddaecddb70ef78e3358ebc3f49e9dfd36a6cf96764d0197950179577d73c406",
   "mask": "98df7ad86eb96679d0013365f037702ab8e9bf974caf49ea6f08779b551efcb5",
   "rgba": "3ffcc1640692a9faad6b918d9b945248e49a905614182f2b4bc7e3fd42571732"
  }
 ],
 "tower_original_effect": [
  {
   "w": 41,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96704,
   "a": 40776,
   "b": 42976,
   "index": "627eac26600a897f390dfbd689f6fe31496e2bd08181d4bf39b750aa9985ec8d",
   "mask": "21909ce120ad153097f32f67318b0bef2cdf8a8bcdffd6752d6cf4a9bbd01e6a",
   "rgba": "0314e9641ac21c0243cf787f233ab7666572a0550635b70a27d7672a32378071"
  },
  {
   "w": 38,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96720,
   "a": 42976,
   "b": 45160,
   "index": "7a3a7e4cfd03ef119785f222b7ccb6a396409e0f8463b0ab94c8522a9bd93ac2",
   "mask": "0c4103c8920f85decef15ccbcc28f29d57bc563ba7702ea24f3f30fa4d5189e7",
   "rgba": "4ab90f9920d949e8df9c06f0d7039d4c8c08476609d14fdfbc1aeadb81f3a879"
  },
  {
   "w": 37,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96732,
   "a": 45160,
   "b": 47344,
   "index": "0624accc086086557d1a719e61e72195171588edc2a404bd63a3d931dc3d32c3",
   "mask": "af58feb63136ff33285d1e0cb693845aefcc0284aec53a0bb5e1aa5e01bc1f99",
   "rgba": "2d9c14db7f3d241e1052f33ae18ae2bf8c67fa37b91519ad11bd1c37531d55d5"
  },
  {
   "w": 38,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96744,
   "a": 47344,
   "b": 49536,
   "index": "e55ae30ff6e9df23621309d3d75ac862cb035d4ab70c1d9e8f9dfa61356a1847",
   "mask": "41acfa94d882edf039f058b421593ea7d9f9d47ae20b09d622313af6ed759baf",
   "rgba": "407f1e300401b3a411f42d114136d873de87400b7ec163c0eae9f0c64f21b622"
  },
  {
   "w": 39,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96756,
   "a": 49536,
   "b": 51764,
   "index": "7e220dfd2c670c6fd211dc0bd74472696ba8bd293083ff811cf498321968a22d",
   "mask": "8aa6c9ab0bd6133937ce205c11b9a164883e437eff9812aab246943dbdddf20f",
   "rgba": "257c4e6e561c799df172f3b8f7a98b42cd720ccac6a791362e3bc41c83ca5b34"
  },
  {
   "w": 40,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96768,
   "a": 51764,
   "b": 54020,
   "index": "c3bba940ef55b25bd4151719f2b98ccbefca11a42ff1832cc31c7747365e5447",
   "mask": "22352de4643f0293da971fae3e39d841bcad2dd0b8cfc51dbdf7e2c6a6b40125",
   "rgba": "23dd9047fc7d100fc438d8ae37472d970cc14f113b8c0899bfcce27a5bb008e3"
  },
  {
   "w": 42,
   "h": 63,
   "x": 22,
   "y": 40,
   "d": 96780,
   "a": 54020,
   "b": 56268,
   "index": "63f56a180dedcfe26039ed6337a9f1eab50bb3723b0e6d6ae3c96461ec6c32d4",
   "mask": "38875163c8b4b7ef3310dd5d6798509e713084762feae4fdc36c6969c6d1efc6",
   "rgba": "a47b34494a28e309814db550993c6066171452deed1127bd50bcd39c978f289e"
  }
 ]
} as const;
async function sha(bytes:Uint8Array){const a=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.slice().buffer));return Array.from(a,v=>v.toString(16).padStart(2,'0')).join('')}
export async function verifySourceFrameWitnessO181(trackName:string,ordinal:number,f:O136EffectFrame):Promise<void>{
 const w=ORIGINAL_FRAME_WITNESSES_O181[trackName]?.[ordinal];
 if(!w || f.ordinal!==ordinal || f.width!==w.w || f.height!==w.h || f.sourceX!==w.x || f.sourceY!==w.y || f.descriptorObject2!==w.d || f.graStart!==w.a || f.graEnd!==w.b)
  throw new Error('O181 original frame geometry / pointer witness mismatch: '+trackName+'/'+ordinal);
 if(await sha(f.indices)!==w.index || await sha(f.mask)!==w.mask || await sha(f.rgba)!==w.rgba)
  throw new Error('O181 original frame byte-hash witness mismatch: '+trackName+'/'+ordinal);
}
