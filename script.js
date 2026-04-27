function normalize(str) {
    return str
        .toLowerCase()
        .replace(/[ァ-ン]/g, s => 
            String.fromCharCode(s.charCodeAt(0) - 0x60)
        );
}

const searchData = musicData.map((m, index) => ({
    ...m,
    index: index,
    searchName: normalize(m.name)
}));

function filterSongs(dayIdx, songPos, keyword) {
    const list = document.getElementById(`results-${dayIdx}-${songPos}`);
    list.innerHTML = '';

    if (!keyword || keyword.length < 1) {
        list.style.display = 'none';
        return;
    }

    const keywordNorm = normalize(keyword);

    const matches = searchData
        .filter(m => m.searchName.startsWith(keywordNorm))
        .concat(
            searchData.filter(m => 
                !m.searchName.startsWith(keywordNorm) &&
                m.searchName.includes(keywordNorm)
            )
        )
        .slice(0, 8);

    if (matches.length > 0) {
        list.style.display = 'block';
        matches.forEach(m => {
            const li = document.createElement('li');
            li.innerText = m.name;

            li.onclick = () => {
                state[dayIdx].selectedSongs[songPos] = m.index;
                list.style.display = 'none';
                saveAndRender();
            };

            list.appendChild(li);
        });
    } else {
        list.style.display = 'none';
    }
}

function sortDays(type) {
    if (type === 'day') {
        state.sort((a, b) => a.day - b.day);
    } else if (type === 'score') {
        state.sort((a, b) => ((b.score123 + b.score4) - (a.score123 + a.score4)));
    } else if (type === 'difficulty') {
        // 易(0) < 中(1) < 難(2) でソート
        const order = {'易': 0, '中': 1, '難': 2};
        state.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    } else if (type === 'color') {
        // 属性の色でソート（sparkle, brilliant, glitter, flash, all の順）
        const order = {sparkle: 0, brilliant: 1, glitter: 2, flash: 3, all: 4, none: 5};
        state.sort((a, b) => {
            const attrA = musicData[a.selectedSongs[0]]?.attr || 'none';
            const attrB = musicData[b.selectedSongs[0]]?.attr || 'none';
            return order[attrA] - order[attrB];
        });
    } else if (type === 'time') {
        // 合計秒数が短い順
        state.sort((a, b) => {
            let tA = 0, tB = 0;
            a.selectedSongs.forEach(i => tA += (musicData[i]?.time || 0));
            b.selectedSongs.forEach(i => tB += (musicData[i]?.time || 0));
            return tA - tB;
        });
    }
    render();
}

function setCount(dayIdx, songPos, val) {
    const num = parseInt(val) || 0;
    state[dayIdx].counts[songPos] = Math.max(0, num);
    saveAndRender();
}

// 今の状態をJSONでダウンロード
function exportData() {
    // localStorageから最新の状態を取得し保存
    const dataToSave = localStorage.getItem('tour_event_30days');
    const blob = new Blob([dataToSave], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "event_data.json";
    a.click();
    URL.revokeObjectURL(url);
}

// 全データを初期状態に
function resetAllData() {
    if(!confirm("本当に全データをリセットしますか？")) return;
    state = Array.from({length: 30}, (_, i) => ({
        day: i + 1, selectedSongs: [null, null, null, null], counts: [0, 0, 0, 0], score123: 0, score4: 0, difficulty: "中"
    }));
    saveAndRender();
    alert("初期化しました");
}

function importData(file) {
    // ファイルが選択されなかった場合・キャンセル時対策
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                state = imported;
                saveAndRender();
                alert("反映しました！");
            } else {
                throw new Error("データ形式が不正です");
            }
        } catch (err) {
            alert("読み込み失敗：ファイルの中身を確認してください。");
            console.error(err);
        }
    };
    
    // ここで直接 file を渡す
    reader.readAsText(file);
}
