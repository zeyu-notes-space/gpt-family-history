# 开源发布检查

## 源码完整性

本次 ZIP 是唯一源码依据。25 个完整条目均通过大小与 CRC；末尾字体条目截断。核心入口、三个动画模块、18 场景配置、Python 编排与拼接脚本和 package.json 已全部恢复。详见 CORE_COMPLETENESS.json 和 CORE_HASHES.json。没有使用其他会话文件补全核心源码。

## 保留

四个 CommonJS 源文件、render_all.py、finish.py、story.json、SCRIPT.md、SOURCES.md、DESIGN.md、双语 SRT、程序化配乐合成及母带源码、音频依赖和配置、四幅生成原画、package.json、锁文件、MIT LICENSE、README、.gitignore、字体与素材说明、恢复和本次验证记录。

## 排除

- soundtrack_150s.wav 及所有音频二进制：遵从发布者对抖音音乐的排除要求；原包原创声明不能替代来源核验。
- 字体二进制和损坏字体：原 ZIP 不完整，许可证无法核验；验证用系统字体也不公开。
- FINAL_QA.json、audio_QA.json、音频 manifest 的 measured_delivery：这些是原制作记录，不是本次验证证明。
- node_modules、Python 缓存、日志、测试静帧、测试 MP4、临时 concat、原 ZIP：可重新生成，或是本次私用验证文件，不属于开源源码。

## 隐私

对最终公开文件执行凭据模式、手机号、邮箱和个人绝对路径扫描；PNG 的文本元数据单独检查。结果记录在 PRIVACY_SCAN.json。测试命令、GitHub 账号凭据和本机字体路径不进入仓库。自动扫描无法给出所有隐私风险的绝对保证。

## 版权

代码使用发布者指定的 MIT 许可。图片保留依据为原包“前轮生成素材”说明及发布者公开授权，没有独立模型或素材授权记录；不能声称版权已获外部机构认证。音乐与无法核验的字体全部排除。来源声明冲突及替换步骤已写入 README。

## 发布端

GitHub 连接器识别账号 zeyu-notes-space，但当前工具没有创建仓库接口。目标仓库此前查询返回 404。本地 GitHub CLI 凭据失效；浏览器自动化入口两次超时。源码包已可独立保存；创建公开目标仓库后仍需实际上传并核验远端文件及 Public 状态。本文件不代表 GitHub 已发布。
