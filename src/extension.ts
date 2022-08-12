// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "laravel-autotranslate" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let transateTextCommand = vscode.commands.registerCommand('laravel-autotranslate.translateBladeText', () => {
		const editor = vscode.window.activeTextEditor;
		let selection = editor?.selection;
		let selectedText = editor?.document.getText(selection) as string;

		if (selectedText != '')
		{
			selectedText = replaceApostrophe(selectedText);

			selectedText = removeNewLines(selectedText);

            getFileName().then((fileName) =>  {
                getKeyName().then((keyName)=>{
                    replaceText(`__('${fileName}.${keyName}')`);
                    addToLanguageFile(selectedText as string,fileName as string,keyName as string);
                });

            });


		}
	});

	let translatePHPCodeCommand = vscode.commands.registerCommand('laravel-autotranslate.translatePHPCode', () => {
		const editor = vscode.window.activeTextEditor;
		let selection = editor?.selection;
		let selectedText = editor?.document.getText(selection) as string;

		if (selectedText !== '')
		{
			// remove first and last '
			selectedText = selectedText.replace(/^'|'$/g,'');
			// remove first and last "
			selectedText = selectedText.replace(/^"|"$/g,'');

			selectedText = removeNewLines(selectedText);

			replaceText(`__('messages.${selectedText}')`);

			addToLanguageFile(selectedText as string,'a','a');
		}
	});

	context.subscriptions.push(transateTextCommand);
	context.subscriptions.push(translatePHPCodeCommand);
}

function replaceApostrophe(selectedText: string)
{
	return selectedText.replace(/'/g, '\\\'');
}

function removeNewLines(selectedText: string)
{
	return selectedText.replace(/\n|\r/g, "");
}

function replaceText(replacedText: string) {
	const editor = vscode.window.activeTextEditor;
	editor?.edit(builder => {
		builder.replace(editor.selection, replacedText);
		editor.document.save();
	});
}

async function getFileName() {

    const fileName = await vscode.window.showInputBox({
        placeHolder: "File Name",
        prompt: "Enter File Name",
        value: ''
    });

    if(fileName === ''){
        console.log(fileName);
        vscode.window.showErrorMessage('A search query is mandatory to execute this action');
      }

    if(fileName !== undefined){
        return fileName+".php";
    }
}
async function getKeyName() {

    const keyName = await vscode.window.showInputBox({
        placeHolder: "Key Name",
        prompt: "Enter key name of the string",
        value: ''
    });

    if(keyName === ''){
        vscode.window.showErrorMessage('A Key name is mandatory to execute this action');
      }

    if(keyName !== undefined){
        return keyName;
    }
}

function addToLanguageFile(selectedText: string, fileName: string,keyName: string)
{
	const editor = vscode.window.activeTextEditor;
	let projectFolder = vscode.workspace.getWorkspaceFolder(editor?.document.uri as vscode.Uri);
	var resourcesPath = projectFolder?.uri.fsPath + "\\lang\\en\\";
	var resourceFilePath = resourcesPath + fileName;

	if (existsSync(resourceFilePath))
	{
		var resourceContent = readFileSync(resourceFilePath, 'utf8');

		// check duplicates
		if (!resourceContent.includes(`"${selectedText}"`))
		{
			var endOfArray = resourceContent.indexOf(']');
			var newContent = resourceContent.slice(0, endOfArray-2); // assuming there is a carriage return before the ]
			newContent += `,\r\n\t"${keyName}" => "${selectedText}"\r\n];`;

			writeFileSync(resourceFilePath, newContent);
		}
	}
	else
		vscode.window.showErrorMessage(`Laravel lang file ${resourceFilePath} not exists on disk`);
}

// this method is called when your extension is deactivated
export function deactivate() { }
