# Snowflake SQL Formatter

Format SQL files using the [snowsql-formatter](https://github.com/Snowflake-Labs/snowsql-formatter) npm package. This plugin is a clone of the [vscode-sql-formatter](https://github.com/kufii/vscode-sql-formatter) with some snowflake specific changes added on.

## Configuration

**`sql-formatter.dialect`**: Changes which dialect to format with (`sql`: Standard SQL, `n1ql`: Couchbase N1QL, `db2`: IBM DB2, `pl/sql`: Oracle PL/SQL). Defaults to `sql`.

**`sql-formatter.uppercase`**: Convert keywords to uppercase. Defaults to false.

**`sql-formatter.linesBetweenQueries`**: Number of linebreaks between queries. Defaults to 2.

## Testing

### Generate VSIX file

```bash
# Install dependencies
yarn install

# login into VS Code extension publish registry
vsce login

# Build a vscode plugin
# vsce package
vsce package --yarn --skip-license; code --force --install-extension vscode-snowsql-formatter-with-py-1.4.5.vsix
```

### Install VSIX into VS Code

The build process should produce a VSIX file. We can then simply go to `VSCode -> Extensions -> Install from VSIX` as shown in the image below:

![image](https://user-images.githubusercontent.com/72515998/116860323-01da9d00-ac1f-11eb-83ee-3d4241df15d4.png)
