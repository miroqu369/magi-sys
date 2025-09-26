# MAGI System - 現在の設定

**作成日:** 2025-09-26 09:32:46
**プロジェクト:** screen-share-459802
**リージョン:** asia-northeast1

## デプロイ状況
- **サービス名:** magi-app
- **アクティブリビジョン:** magi-app-00045-ptq
- **サービスURL:** 

## 動作状況
- ✅ Grok (xAI): 正常動作
- ✅ Gemini: 正常動作  
- ❓ Anthropic (Claude): x-api-keyヘッダーに修正済み（テスト中）

## ファイル構成
```
.:
=
bootstrap.js
bootstrap.js.bak.1758779414
bootstrap.js.bak.1758799567
bootstrap.js.bak.1758799858
bootstrap.js.bak.1758800589
bootstrap.js.bak.1758801015
consensus.js
consensus.js.bak.1758798726
consensus.js.bak.1758801760
consensus.js.bak.1758802001
consensus.js.bak.1758802274
consensus.js.bak.1758802869
consensus.js.bak.1758804150
consensus.js.bak.1758805239
consensus.js.bak.1758805419
consensus.js.bak.1758805882
consensus.js.bak.1758806889
consensus.js.bak.1758807244
consensus.js.bak.1758807664
consensus.js.bak.1758808048
CURRENT_CONFIG.md
decision.js
decision.js.bak.1758797533
decision.js.bak.1758798363
eva-magi-server.js
eva-magi-server.js.bak.1758799161
eva-magi-server.js.bak.1758799227
grok-consensus-server.js
grok-consensus-server.js.bak.1758799161
grok-consensus-server.js.bak.1758799227
LICENSE
magi-app
node_modules
package.json
package.json.bak.1758800243
package.json.bak.1758801033
package-lock.json
providers
public
README.md
real-magi-server.js
real-magi-server.js.bak.1758799161
real-magi-server.js.bak.1758799227
routes
routes-introspect.js
server.js
server.js.backup
server.js.bak.1758779414
server.js.bak.1758799161
server.js.bak.1758799227
server.js.bak.1758801486
server.js.disabled
setup-secrets.sh
test-local.js
test-server.js
test-server.js.bak.1758799161
test-server.js.bak.1758799227
utils

./magi-app:
bootstrap.js
bootstrap.js.bak.1758799580
bootstrap.js.bak.1758799858
package.json
providers
server.js

./magi-app/providers:
anthropic.js
gemini.js
grok.js
openai.js

./node_modules:
accepts
array-flatten
bytes
call-bind-apply-helpers
call-bound
content-disposition
content-type
cookie
cookie-signature
debug
depd
destroy
dunder-proto
ee-first
encodeurl
escape-html
es-define-property
es-errors
es-object-atoms
etag
express
finalhandler
forwarded
fresh
function-bind
get-intrinsic
get-proto
gopd
hasown
has-symbols
http-errors
inherits
ipaddr.js
math-intrinsics
media-typer
merge-descriptors
methods
mime
mime-db
mime-types
ms
negotiator
object-inspect
on-finished
parseurl
path-to-regexp
proxy-addr
qs
range-parser
safe-buffer
safer-buffer
send
serve-static
setprototypeof
side-channel
side-channel-list
side-channel-map
side-channel-weakmap
statuses
toidentifier
type-is
unpipe
utils-merge
vary

./node_modules/accepts:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/array-flatten:
array-flatten.js
LICENSE
package.json
README.md

./node_modules/bytes:
History.md
index.js
LICENSE
package.json
Readme.md

./node_modules/call-bind-apply-helpers:
actualApply.d.ts
actualApply.js
applyBind.d.ts
applyBind.js
CHANGELOG.md
functionApply.d.ts
functionApply.js
functionCall.d.ts
functionCall.js
index.d.ts
index.js
LICENSE
package.json
README.md
reflectApply.d.ts
reflectApply.js
test
tsconfig.json

./node_modules/call-bind-apply-helpers/test:
index.js

./node_modules/call-bound:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
test
tsconfig.json

./node_modules/call-bound/test:
index.js

./node_modules/content-disposition:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/content-type:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/cookie:
index.js
LICENSE
package.json
README.md
SECURITY.md

./node_modules/cookie-signature:
History.md
index.js
package.json
Readme.md

./node_modules/debug:
CHANGELOG.md
component.json
karma.conf.js
LICENSE
Makefile
node.js
package.json
README.md
src

./node_modules/debug/src:
browser.js
debug.js
index.js
inspector-log.js
node.js

./node_modules/depd:
History.md
index.js
lib
LICENSE
package.json
Readme.md

./node_modules/depd/lib:
browser

./node_modules/depd/lib/browser:
index.js

./node_modules/destroy:
index.js
LICENSE
package.json
README.md

./node_modules/dunder-proto:
CHANGELOG.md
get.d.ts
get.js
LICENSE
package.json
README.md
set.d.ts
set.js
test
tsconfig.json

./node_modules/dunder-proto/test:
get.js
index.js
set.js

./node_modules/ee-first:
index.js
LICENSE
package.json
README.md

./node_modules/encodeurl:
index.js
LICENSE
package.json
README.md

./node_modules/escape-html:
index.js
LICENSE
package.json
Readme.md

./node_modules/es-define-property:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
test
tsconfig.json

./node_modules/es-define-property/test:
index.js

./node_modules/es-errors:
CHANGELOG.md
eval.d.ts
eval.js
index.d.ts
index.js
LICENSE
package.json
range.d.ts
range.js
README.md
ref.d.ts
ref.js
syntax.d.ts
syntax.js
test
tsconfig.json
type.d.ts
type.js
uri.d.ts
uri.js

./node_modules/es-errors/test:
index.js

./node_modules/es-object-atoms:
CHANGELOG.md
index.d.ts
index.js
isObject.d.ts
isObject.js
LICENSE
package.json
README.md
RequireObjectCoercible.d.ts
RequireObjectCoercible.js
test
ToObject.d.ts
ToObject.js
tsconfig.json

./node_modules/es-object-atoms/test:
index.js

./node_modules/etag:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/express:
History.md
index.js
lib
LICENSE
node_modules
package.json
Readme.md

./node_modules/express/lib:
application.js
express.js
middleware
request.js
response.js
router
utils.js
view.js

./node_modules/express/lib/middleware:
init.js
query.js

./node_modules/express/lib/router:
index.js
layer.js
route.js

./node_modules/express/node_modules:
body-parser
iconv-lite
raw-body

./node_modules/express/node_modules/body-parser:
HISTORY.md
index.js
lib
LICENSE
package.json
README.md
SECURITY.md

./node_modules/express/node_modules/body-parser/lib:
read.js
types

./node_modules/express/node_modules/body-parser/lib/types:
json.js
raw.js
text.js
urlencoded.js

./node_modules/express/node_modules/iconv-lite:
Changelog.md
encodings
lib
LICENSE
package.json
README.md

./node_modules/express/node_modules/iconv-lite/encodings:
dbcs-codec.js
dbcs-data.js
index.js
internal.js
sbcs-codec.js
sbcs-data-generated.js
sbcs-data.js
tables
utf16.js
utf7.js

./node_modules/express/node_modules/iconv-lite/encodings/tables:
big5-added.json
cp936.json
cp949.json
cp950.json
eucjp.json
gb18030-ranges.json
gbk-added.json
shiftjis.json

./node_modules/express/node_modules/iconv-lite/lib:
bom-handling.js
extend-node.js
index.d.ts
index.js
streams.js

./node_modules/express/node_modules/raw-body:
HISTORY.md
index.d.ts
index.js
LICENSE
package.json
README.md
SECURITY.md

./node_modules/finalhandler:
HISTORY.md
index.js
LICENSE
package.json
README.md
SECURITY.md

./node_modules/forwarded:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/fresh:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/function-bind:
CHANGELOG.md
implementation.js
index.js
LICENSE
package.json
README.md
test

./node_modules/function-bind/test:
index.js

./node_modules/get-intrinsic:
CHANGELOG.md
index.js
LICENSE
package.json
README.md
test

./node_modules/get-intrinsic/test:
GetIntrinsic.js

./node_modules/get-proto:
CHANGELOG.md
index.d.ts
index.js
LICENSE
Object.getPrototypeOf.d.ts
Object.getPrototypeOf.js
package.json
README.md
Reflect.getPrototypeOf.d.ts
Reflect.getPrototypeOf.js
test
tsconfig.json

./node_modules/get-proto/test:
index.js

./node_modules/gopd:
CHANGELOG.md
gOPD.d.ts
gOPD.js
index.d.ts
index.js
LICENSE
package.json
README.md
test
tsconfig.json

./node_modules/gopd/test:
index.js

./node_modules/hasown:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
tsconfig.json

./node_modules/has-symbols:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
shams.d.ts
shams.js
test
tsconfig.json

./node_modules/has-symbols/test:
index.js
shams
tests.js

./node_modules/has-symbols/test/shams:
core-js.js
get-own-property-symbols.js

./node_modules/http-errors:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/inherits:
inherits_browser.js
inherits.js
LICENSE
package.json
README.md

./node_modules/ipaddr.js:
ipaddr.min.js
lib
LICENSE
package.json
README.md

./node_modules/ipaddr.js/lib:
ipaddr.js
ipaddr.js.d.ts

./node_modules/math-intrinsics:
abs.d.ts
abs.js
CHANGELOG.md
constants
floor.d.ts
floor.js
isFinite.d.ts
isFinite.js
isInteger.d.ts
isInteger.js
isNaN.d.ts
isNaN.js
isNegativeZero.d.ts
isNegativeZero.js
LICENSE
max.d.ts
max.js
min.d.ts
min.js
mod.d.ts
mod.js
package.json
pow.d.ts
pow.js
README.md
round.d.ts
round.js
sign.d.ts
sign.js
test
tsconfig.json

./node_modules/math-intrinsics/constants:
maxArrayLength.d.ts
maxArrayLength.js
maxSafeInteger.d.ts
maxSafeInteger.js
maxValue.d.ts
maxValue.js

./node_modules/math-intrinsics/test:
index.js

./node_modules/media-typer:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/merge-descriptors:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/methods:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/mime:
CHANGELOG.md
cli.js
LICENSE
mime.js
package.json
README.md
src
types.json

./node_modules/mime/src:
build.js
test.js

./node_modules/mime-db:
db.json
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/mime-types:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/ms:
index.js
license.md
package.json
readme.md

./node_modules/negotiator:
HISTORY.md
index.js
lib
LICENSE
package.json
README.md

./node_modules/negotiator/lib:
charset.js
encoding.js
language.js
mediaType.js

./node_modules/object-inspect:
CHANGELOG.md
example
index.js
LICENSE
package.json
package-support.json
readme.markdown
test
test-core-js.js
util.inspect.js

./node_modules/object-inspect/example:
all.js
circular.js
fn.js
inspect.js

./node_modules/object-inspect/test:
bigint.js
browser
circular.js
deep.js
element.js
err.js
fakes.js
fn.js
global.js
has.js
holes.js
indent-option.js
inspect.js
lowbyte.js
number.js
quoteStyle.js
toStringTag.js
undef.js
values.js

./node_modules/object-inspect/test/browser:
dom.js

./node_modules/on-finished:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/parseurl:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/path-to-regexp:
index.js
LICENSE
package.json
Readme.md

./node_modules/proxy-addr:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/qs:
CHANGELOG.md
dist
lib
LICENSE.md
package.json
README.md
test

./node_modules/qs/dist:
qs.js

./node_modules/qs/lib:
formats.js
index.js
parse.js
stringify.js
utils.js

./node_modules/qs/test:
empty-keys-cases.js
parse.js
stringify.js
utils.js

./node_modules/range-parser:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/safe-buffer:
index.d.ts
index.js
LICENSE
package.json
README.md

./node_modules/safer-buffer:
dangerous.js
LICENSE
package.json
Porting-Buffer.md
Readme.md
safer.js
tests.js

./node_modules/send:
HISTORY.md
index.js
LICENSE
node_modules
package.json
README.md
SECURITY.md

./node_modules/send/node_modules:
encodeurl
ms

./node_modules/send/node_modules/encodeurl:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/send/node_modules/ms:
index.js
license.md
package.json
readme.md

./node_modules/serve-static:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/setprototypeof:
index.d.ts
index.js
LICENSE
package.json
README.md
test

./node_modules/setprototypeof/test:
index.js

./node_modules/side-channel:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
test
tsconfig.json

./node_modules/side-channel/test:
index.js

./node_modules/side-channel-list:
CHANGELOG.md
index.d.ts
index.js
LICENSE
list.d.ts
package.json
README.md
test
tsconfig.json

./node_modules/side-channel-list/test:
index.js

./node_modules/side-channel-map:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
test
tsconfig.json

./node_modules/side-channel-map/test:
index.js

./node_modules/side-channel-weakmap:
CHANGELOG.md
index.d.ts
index.js
LICENSE
package.json
README.md
test
tsconfig.json

./node_modules/side-channel-weakmap/test:
index.js

./node_modules/statuses:
codes.json
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/toidentifier:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/type-is:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/unpipe:
HISTORY.md
index.js
LICENSE
package.json
README.md

./node_modules/utils-merge:
index.js
LICENSE
package.json
README.md

./node_modules/vary:
HISTORY.md
index.js
LICENSE
package.json
README.md

./providers:
anthropic.js
anthropic.js.BAD.1758804412
anthropic.js.bak.1758803728
anthropic.js.bak.1758804135
gemini.js
grok.js
openai.js
registry.js

./public:
eva.html
grok-unique.html
index.html

./routes:
enforce-consensus.js

./utils:
callChat.js
```

## Secret Manager
- OPENAI_API_KEY: 登録済み
- GEMINI_API_KEY: 登録済み
- ANTHROPIC_API_KEY: バージョン3（最新、x-api-key用）
- XAI_API_KEY: バージョン8（最新）

## 次回起動時の手順
1. cd ~/magi-system
2. git pull (リモートリポジトリがある場合)
3. gcloud run deploy magi-app --region=asia-northeast1 --source .
