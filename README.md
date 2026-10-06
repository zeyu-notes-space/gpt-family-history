# GPT 家族史 · 语言的回声（V3）

一个以代码绘制的短片工程：18 个场景，目标时长 150 秒，1920×1080、30fps，中英字幕，无旁白。文字、线条、粒子、路径与转场由 Canvas 程序逐帧绘制，部分场景叠加生成原画。它不是剪映或 Remotion 工程，也不调用模型 API。

本仓库依据 V3 可编辑制作包恢复和整理。原 ZIP 缺少中央目录，末尾字体数据被截断；25 个完整条目通过解压大小及 CRC 校验。全部场景实现、入口、三个动画模块、Python 编排与拼接脚本、故事配置和依赖声明均已恢复。详见 `ARCHIVE_RECOVERY.json`、`CORE_COMPLETENESS.json` 与 `VALIDATION.md`。字体和音乐文件有意不随仓库发布。

## 实际技术栈

- Node.js / CommonJS；`@napi-rs/canvas` 固定版本 `0.1.100`。
- Python 3：编排分段渲染、拼接及音频合成。
- FFmpeg / ffprobe：RGBA 帧流编码为 H.264、拼接、AAC 音频封装与媒体检查。
- 可选程序化配乐源码使用 NumPy / SciPy。
- `v3/story.json` 是场景、时间和字幕配置；画面尺寸在 `render.cjs` 固定为 1920×1080，修改 JSON 的尺寸字段不会自动改变画布。

## 安装与环境

准备 Node.js（本次验证为 26.8.1）、Python 3（本次验证为 3.9.6）以及包含 `libx264` 的 FFmpeg / ffprobe，并让 `node`、`python3`、`ffmpeg`、`ffprobe` 在 PATH 中可用。上述是本次实测版本，不代表已测试所有版本。安装依赖：

```sh
npm ci
```

配乐合成是可选步骤，建议在虚拟环境安装：

```sh
python3 -m venv .venv
# macOS / Linux
. .venv/bin/activate
python3 -m pip install -r v3/audio/requirements.txt
```

Windows 使用对应的虚拟环境激活命令；本次没有验证 Windows。推荐预留至少 8 GB 内存及足够磁盘空间；原渲染编排最多同时启动两个 Node 进程，实际峰值内存尚未测量。

## 必须准备的字体

渲染入口按以下路径注册字体，别名分别为 `Chinese`、`Serif`、`SerifItalic`：

```text
fonts/NotoSerifCJKsc-Regular.otf
fonts/Serif.otf
fonts/SerifItalic.otf
```

请从有明确许可证的来源取得支持简体中文的字体、英文衬线正体和斜体，并放到上述路径。中文可采用对应名称的 Noto Serif CJK SC；英文可选择有明确授权的衬线字体，再按入口约定命名。保留各字体许可证，并自行检查其允许的使用和再分发范围；不要仅靠重命名判断格式或授权。

原包的中文字体条目损坏，英文字体及许可证未恢复，因此仓库不附带字体二进制。入口没有强制检查字体注册成功：字体缺失时可能继续运行，但会出现缺字、错误回退和版式差异。生成文件不等于正确复现；请先检查代表静帧。

## 静帧与关键片段

在仓库根目录执行：

```sh
# 每个场景生成一张代表静帧，共 18 张
npm run stills

# 指定时间，单位秒
node --expose-gc v3/render.cjs stills 3,8,14,20,29,40,47,57,65,75,85,95,105,115,125,134,143,149

# 多模态过渡：3 秒、640×360、无声
node --expose-gc v3/render.cjs segment 79 82 v3/output/sample-omni.mp4 640

# 家谱片段：1 秒、原生 1080p、无声
node --expose-gc v3/render.cjs segment 119 120 v3/output/sample-family.mp4
```

静帧写入 `v3/output/qa_stills/`。先运行静帧命令创建输出目录，再运行片段命令。片段参数依次为模式、起止秒数、输出路径和可选宽度；高度为宽度的 9/16。请使用得到偶数高度的宽度，例如 640、1280、1920，满足 yuv420p 编码要求。

## 完整渲染

### 使用自己有权使用的配乐

仓库不包含原包音乐。将有合法使用权的音频准备为 `v3/audio/soundtrack_150s.wav`（建议 150 秒、48 kHz、立体声），完成字体配置后执行：

```sh
npm run render
```

`v3/render_all.py` 调用 Node 分别渲染 0–50、50–100、100–150 秒，两个进程并行，接着用 FFmpeg 拼接视频并封装 AAC 配乐。产物为：

```text
v3/output/GPT家族史_语言的回声_1080p.mp4
```

必须在开始前准备音乐。原脚本是在三段视频渲染结束后才检查配乐是否存在，缺失时会报错，但已生成的分段仍在输出目录。

### 无音乐版本

如不添加音乐，可先分别生成三段，再拼接为无声视频：

```sh
npm run stills
node --expose-gc v3/render.cjs segment 0 50 v3/output/segment_000.mp4
node --expose-gc v3/render.cjs segment 50 100 v3/output/segment_050.mp4
node --expose-gc v3/render.cjs segment 100 150 v3/output/segment_100.mp4
python3 -c "from pathlib import Path; Path('v3/output/silent-concat.txt').write_text(\"file 'segment_000.mp4'\nfile 'segment_050.mp4'\nfile 'segment_100.mp4'\n\")"
ffmpeg -hide_banner -y -f concat -safe 0 -i v3/output/silent-concat.txt -c:v copy -an -movflags +faststart v3/output/gpt-family-history-silent.mp4
```

### 可选：程序化配乐源码

`v3/audio/compose_score.py` 以固定随机种子合成钢琴、弦乐、拨弦与空气音色，没有外部音频读取；`render_audio.py` 做母带处理和音频 QA。可运行：

```sh
python3 v3/audio/render_audio.py
```

这会生成新的音频文件及测量记录。原包文档称其为原创程序化配乐，但发布者说明影片音乐来自抖音；两者来源描述存在冲突，因此原包 WAV 一律排除，不用原文档的“原创”标签作为其授权证明。保留的仅是可检查的合成源码，使用者可选择不使用。此合成流程本次仅完成语法检查，没有执行完整音频生成或音频 QA。

## 目录

```text
.
├── README.md / LICENSE / .gitignore
├── package.json / package-lock.json
├── ARCHIVE_RECOVERY.json / CORE_COMPLETENESS.json
├── VALIDATION.md / RELEASE_AUDIT.md
├── assets/                 # 四幅生成原画和来源说明
├── fonts/README.md         # 字体准备说明；无字体二进制
└── v3/
    ├── render.cjs          # 入口、逐帧绘制、静帧及片段编码
    ├── film_motifs.cjs     # V3 的主要动态场景
    ├── ink_motifs.cjs      # 注意力、词元、推理等纸面动画
    ├── language_motifs.cjs # 工具等语言意象动画
    ├── story.json          # 18 场景、时间轴、字幕
    ├── render_all.py       # 三段渲染、视频拼接与配乐封装
    ├── finish.py           # 原版验收和制作包脚本，见限制
    ├── SCRIPT.md / SOURCES.md / DESIGN.md
    ├── output/            # 保留双语 SRT；新渲染产物不提交
    └── audio/             # 配乐合成源码、依赖和配置；无 WAV
```

## 素材与版权

代码以 MIT 许可发布。第三方素材许可独立于代码，MIT 不替代字体、音乐或其他第三方权利。

- 四幅原画为原包 README 所述的“前轮生成素材”，发布者授权公开。原包未提供生成模型、提示词或独立授权凭证；不能据此保证全球无任何第三方权利。具体文件见 `assets/README.md`。
- 不发布来自抖音的音乐，也不发布任何原包音频二进制。替换方法见上。
- 不发布损坏或无法核验许可证的字体。读者需自行准备有权使用的字体。
- `SOURCES.md` 保留原包史实参考和表达边界，其“核查于 2026-09-26”是原制作记录，本次未重新逐链接核验。
- 所有对话、代码和能力演示为动画示意，并非模型现场录屏。项目与 OpenAI 无官方关联。

## 已知限制与验证边界

- 核心源码完整性已通过静态依赖、函数定义/导出、连续时间轴和 18 场景静帧运行检查；这不等于恢复了原 ZIP 未写完的全部素材。
- 原始字体不齐。缺失字体可导致中文缺字；本次用不随仓库发布的系统替代字体验证，无法声称原字体及版式完全一致。
- 已安装精确 Canvas 依赖，验证代表静帧和关键视频片段；没有完成完整 150 秒、4500 帧、有声成片验证。
- `finish.py` 是原制作环境脚本，除了拼接和解码还会尝试把音乐和字体放入制作包，并引用 `v3/README.md`、`v3/package.json`，这些路径不在恢复包内。为保留原源码没有改写它；公开版本应使用 `render_all.py` 或上面的无声流程，不要把它生成的私用 ZIP 当成开源发布包。
- `render_all.py` 支持原环境的 `CODEX_PRIMARY_RUNTIME_NODE` 和 `CODEX_PRIMARY_RUNTIME_NODE_MODULES` 覆盖项，通常无需设置；普通环境会使用 PATH 的 Node 和本项目依赖。
- Python 音频依赖未锁定版本；音频流程、Windows/Linux 平台及全片性能尚未实测。
- 部分时长、帧率、画布与输出名称写死于脚本。修改故事总时长时需同步检查脚本中的 150 秒和三段范围。
