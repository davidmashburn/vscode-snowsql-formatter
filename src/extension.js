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

const formatPy = (text, config) => {
	let outputLines = [];
	const lines = text.split('\n');
	let isSql = false;
	let sqlLines = [];

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim().endsWith('"""--sql')) {
			isSql = true;
			outputLines.push(lines[i]);
			sqlLines = [];
		} else if ( lines[i].trim().startsWith(';"""') ) {
			isSql = false;
			outputLines.push(format(sqlLines.join("\n")))
			outputLines.push(lines[i])
		} else if ( isSql ) {
			sqlLines.push(lines[i]);
		} else {
			outputLines.push(lines[i]);
		}
	}

	return outputLines.join('\n');
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
