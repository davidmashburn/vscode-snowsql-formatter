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

const commentPyToSql = (text) => {
	const lines = text.split('\n');
	const patterns = [
		/^\s*#/,        // Match lines starting with any whitespace followed by a #
		/^;"""/,        // Match lines starting with ;"""
		/"""\s*--sql$/ // Match lines ending with """--sql
	];

	for (let i = 0; i < lines.length; i++) {
		for (let pattern of patterns) {
			if (pattern.test(lines[i])) {
				lines[i] = '-- ' + lines[i];
				break;
			}
		}
	}

	return lines.join('\n');

};

const revertSqlToPy = (text) => {
	const lines = text.split('\n');
	const patterns = [
		/^\s-- *#/,        // Match lines starting with any whitespace followed by a #
		/^-- ;"""/,        // Match lines starting with ;"""
		/"""\s-- *--sql$/ // Match lines ending with """--sql
	];

	for (let i = 0; i < lines.length; i++) {
		for (let pattern of patterns) {
			if (pattern.test(lines[i])) {
				lines[i] = '-- ' + lines[i];
				break;
			}
		}
	}

	return lines.join('\n');
};

const formatPy = (text, config) => {
	commentedPy = commentPyToSql(text)
	formattedSql = sqlFormatter.format(commentedPy, config);
	formattedPy = revertSqlToPy(formattedSql)
};

module.exports.activate = () =>
	vscode.languages.registerDocumentRangeFormattingEditProvider('sql', {
		provideDocumentRangeFormattingEdits: (document, range, options) => [
			vscode.TextEdit.replace(range, format(document.getText(range), getConfig(options)))
		]
	});
vscode.languages.registerDocumentRangeFormattingEditProvider('py', {
	provideDocumentRangeFormattingEdits: (document, range, options) => [
		vscode.TextEdit.replace(range, formatPy(document.getText(range), getConfig(options)))
	]
});
