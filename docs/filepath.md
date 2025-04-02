
### `process.env.PORTABLE_EXECUTABLE_DIR` 是什麼？
- **定義**：`process.env.PORTABLE_EXECUTABLE_DIR` 是一個環境變數，僅在 `electron-builder` 的 **portable 模式** 下可用。它表示 portable `.exe` 執行檔案所在的目錄。
- **行為**：
  - 當你使用 `portable` 目標打包（例如 `target: 'portable'`），並運行生成的 `.exe` 時，Electron 會設置這個環境變數，指向 `.exe` 檔案的實際路徑（而不是解壓後的臨時目錄）。
  - 例如，如果你將 `Alma3.exe` 放在 `D:\MyApp\` 並執行它，`process.env.PORTABLE_EXECUTABLE_DIR` 會返回 `D:\MyApp`。
- **限制**：這個變數僅適用於 portable 模式，在其他打包模式（如 `nsis`、`7z`、`dir` 等）下，`process.env.PORTABLE_EXECUTABLE_DIR` 會是 `undefined`。

#### 驗證範例
在 `electron-main.js` 中：
```javascript
console.log('Portable Executable Dir:', process.env.PORTABLE_EXECUTABLE_DIR);
console.log('執行路徑:', process.execPath);
```
- **Portable 模式輸出**：
  ```
  Portable Executable Dir: D:\MyApp
  執行路徑: D:\MyApp\Alma3.exe
  ```
- **非 Portable 模式輸出**：
  ```
  Portable Executable Dir: undefined
  執行路徑: C:\Program Files\Alma3\Alma3.exe（NSIS 示例）
  ```

**結論**：是的，`process.env.PORTABLE_EXECUTABLE_DIR` 可以用來獲取 portable 打包後執行檔案的路徑，但它只在 portable 模式下有效。

---

### 在 `7z` 打包模式下如何獲取執行檔案路徑？
在 `electron-builder` 的 `7z` 模式下，應用程式會被打包成一個 `.7z` 壓縮檔案，用戶需要手動解壓到某個目錄，然後運行其中的 `.exe` 檔案。與 portable 模式不同，`7z` 模式不會自動解壓到臨時目錄，因此 `process.env.PORTABLE_EXECUTABLE_DIR` 不適用。以下是獲取執行檔案路徑的方法：

#### 方法 1：使用 `process.execPath`
- **描述**：`process.execPath` 是 Node.js 提供的一個全局變數，返回當前執行檔案的完整路徑（包括檔案名稱）。在 Electron 中，它始終指向運行中的 `.exe` 檔案。
- **適用性**：無論是 `7z`、`nsis`、`dir` 還是其他模式，`process.execPath` 都能正確返回執行檔案路徑。
- **範例**：
  ```javascript
  const path = require('path');

  console.log('執行檔案路徑:', process.execPath);
  console.log('執行檔案目錄:', path.dirname(process.execPath));
  ```
  - **假設**：你將 `Alma3-win32-x64.7z` 解壓到 `C:\MyApp`，然後運行 `C:\MyApp\Alma3.exe`。
  - **輸出**：
    ```
    執行檔案路徑: C:\MyApp\Alma3.exe
    執行檔案目錄: C:\MyApp
    ```

- **優點**：簡單可靠，適用於所有打包模式。
- **注意**：如果你需要目錄而非檔案路徑，使用 `path.dirname(process.execPath)` 提取目錄部分。

#### 方法 2：使用 `app.getAppPath()`（輔助方法）
- **描述**：`app.getAppPath()` 返回應用程式的主要資源路徑。在 `7z` 模式下，它通常指向解壓後的應用程式目錄（例如 `C:\MyApp\resources\app`）。
- **範例**：
  ```javascript
  const { app } = require('electron');
  const path = require('path');

  console.log('應用路徑:', app.getAppPath());
  console.log('執行檔案目錄:', path.dirname(process.execPath));
  ```
  - **輸出**（假設解壓到 `C:\MyApp`）：
    ```
    應用路徑: C:\MyApp\resources\app
    執行檔案目錄: C:\MyApp
    ```

- **適用性**：`app.getAppPath()` 適合獲取應用資源路徑，但若要直接獲取 `.exe` 所在目錄，仍需結合 `process.execPath`。

#### `7z` 模式的特點
- **打包結果**：`7z` 模式生成一個壓縮檔案（例如 `Alma3-win32-x64.7z`），解壓後是一個完整的應用目錄結構（類似 `win-unpacked`）。
- **運行時**：用戶運行解壓後的 `.exe`，此時 Electron 不會設置 `PORTABLE_EXECUTABLE_DIR`，因為這不是 portable 模式。
- **路徑獲取**：依賴 `process.execPath` 是最直接的方式。

---

### 程式碼實現建議
根據你的需求（在 portable 模式下使用 `PORTABLE_EXECUTABLE_DIR`，在 `7z` 等其他模式下獲取執行路徑），可以在 `electron-main.js` 中添加動態檢查：

```javascript
const { app } = require('electron');
const path = require('path');

// 獲取執行檔案目錄
function getExecutableDir() {
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        // Portable 模式
        return process.env.PORTABLE_EXECUTABLE_DIR;
    } else {
        // 其他模式（包括 7z、nsis、dir 等）
        return path.dirname(process.execPath);
    }
}

app.on('ready', () => {
    const executableDir = getExecutableDir();
    console.log('執行檔案目錄:', executableDir);
    // 後續邏輯，例如創建窗口
});
```

- **效果**：
  - 在 portable 模式下，返回 `PORTABLE_EXECUTABLE_DIR`（例如 `D:\MyApp`）。
  - 在 `7z` 模式下，返回解壓後 `.exe` 的目錄（例如 `C:\MyApp`）。

---

### 結論
1. **`process.env.PORTABLE_EXECUTABLE_DIR`**：
   - 是的，它用於獲取 portable 打包後執行檔案的路徑，但僅在 portable 模式下有效。
2. **`7z` 模式下的執行檔案路徑**：
   - 使用 `process.execPath` 獲取完整路徑（例如 `C:\MyApp\Alma3.exe`）。
   - 使用 `path.dirname(process.execPath)` 獲取目錄（例如 `C:\MyApp`）。
   - `PORTABLE_EXECUTABLE_DIR` 在 `7z` 模式下不可用，因為它不是 portable 模式。

#### 測試建議
- **Portable 模式**：
  - 配置 `quasar.config.js`：`win: { target: 'portable' }`，打包並運行 `.exe`，檢查 `process.env.PORTABLE_EXECUTABLE_DIR`。
- **7z 模式**：
  - 配置 `quasar.config.js`：`win: { target: '7z' }`，打包後解壓 `.7z`，運行 `.exe`，檢查 `process.execPath`。
