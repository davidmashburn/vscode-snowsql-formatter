'use strict';

const vscode = require('vscode');
const sqlFormatter = require('snowsql-formatter');

const getSetting = (group, key, def) => {
	const settings = vscode.workspace.getConfiguration(group, null);
	const editor = vscode.window.activeTextEditor;
	const language = editor && editor.document && editor.document.languageId;
	const languageSettings =
		language && vscode.workspace.getConfiguration(null, null).get(`[${language}]`);
	let value = languageSettings && languageSettings[`${group}.${key}`];
	if (value == null) value = settings.get(key, def);
	return value == null ? def : value;
};

const getConfig = ({ insertSpaces, tabSize }) => ({
	indent: insertSpaces ? ' '.repeat(tabSize) : '\t',
	language: getSetting('sql-formatter', 'dialect', 'sql'),
	uppercase: getSetting('sql-formatter', 'uppercase', false),
	linesBetweenQueries: getSetting('sql-formatter', 'linesBetweenQueries', 2)
});

const format = (text, config) => sqlFormatter.format(text, config);

const isPyLine = trimmed_line => {
	return (
		trimmed_line.startsWith('#') ||
		trimmed_line.startsWith(';"""') ||
		trimmed_line.startsWith(";'''") ||
		trimmed_line.endsWith('"""--sql') ||
		trimmed_line.endsWith("'''--sql")
	);
};

const commentPyToSql = text => {
	const lines = text.split('\n');

	for (let i = 0; i < lines.length; i++) {
		if (isPyLine(lines[i].trim())) {
			lines[i] = '-- ' + lines[i];
		}
	}

	return lines.join('\n');
};

const revertSqlToPy = text => {
	const lines = text.split('\n');

	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].startsWith('-- ')) {
			continue;
		}
		if (isPyLine(lines[i].slice(3).trim())) {
			lines[i] = lines[i].slice(0, 3);
		}
	}

	return lines.join('\n');
};

const formatPy = (text, config) => {
	const commentedPy = commentPyToSql(text);
	const formattedSql = sqlFormatter.format(commentedPy, config);
	const formattedPy = revertSqlToPy(formattedSql);
	return ["text", text, "commentedPy", commentedPy, "formattedSql", formattedSql, "formattedPy", formattedPy].join('\n\n');
};

module.exports.activate = () => {
	vscode.languages.registerDocumentRangeFormattingEditProvider('python', {
		provideDocumentRangeFormattingEdits: (document, range, options) => [
			vscode.TextEdit.replace(range, formatPy(document.getText(range), getConfig(options)))
		]
	});
	vscode.languages.registerDocumentRangeFormattingEditProvider('sql', {
		provideDocumentRangeFormattingEdits: (document, range, options) => [
			vscode.TextEdit.replace(range, format(document.getText(range), getConfig(options)))
		]
	});
};
