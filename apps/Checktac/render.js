// data-md 属性で指定された Markdown ファイルを読み込み、HTML に変換して表示する。
// これにより .md を更新するだけでページの内容が自動的に反映される（HTML の再編集は不要）。
(function () {
	var el = document.getElementById("content");
	if (!el) return;
	var src = el.getAttribute("data-md");

	fetch(src, { cache: "no-cache" })
		.then(function (res) {
			if (!res.ok) throw new Error("HTTP " + res.status);
			return res.text();
		})
		.then(function (md) {
			el.innerHTML = marked.parse(md);
			// 先頭の見出し（# ...）を <title> にも反映
			var h1 = el.querySelector("h1");
			if (h1) document.title = h1.textContent + " | Checktac";
		})
		.catch(function (err) {
			el.innerHTML =
				'<p class="loading">ドキュメントを読み込めませんでした。時間をおいて再度お試しください。</p>';
			console.error("Markdown load failed:", err);
		});
})();
