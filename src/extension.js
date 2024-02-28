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

const removeSpacesInsideCurly = (text) => {
	let output = '';
	let inBrackets = false;

	for (const char of text) {
		if (char === '{') {
			inBrackets = true;
		} else if (char === '}') {
			inBrackets = false;
		}

		if (inBrackets && char === ' ') {
			continue;
		}
		output += char;
	}

	return output;
};


const formatPy = (text, config) => {
	const outputLines = [];
	const lines = text.split('\n');
	let isSql = false;
	let sqlLines = [];
	let sqlIndentation = '';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim().endsWith('"""--sql')) {
			outputLines.push(line);
			sqlLines = [];
			sqlIndentation = ' '.repeat(line.length - line.trimLeft().length);
			isSql = true;
		} else if (line.trim().startsWith(';"""')) {
			const formattedSql = format(sqlLines.join('\n'), config);
			const indentedSql = sqlIndentation + formattedSql.replaceAll('\n', '\n' + sqlIndentation);
			const correctedSql = removeSpacesInsideCurly(indentedSql);
			outputLines.push(correctedSql);
			outputLines.push(sqlIndentation + line.trim());
			isSql = false;
		} else if (isSql) {
			sqlLines.push(line);
		} else {
			outputLines.push(line);
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
