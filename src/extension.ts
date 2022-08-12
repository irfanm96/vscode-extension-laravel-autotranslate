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
                console.log(fileName);
                replaceText(`@lang('messages.${selectedText}')`);

                addToLanguageFile(selectedText as string,fileName as string);
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

			addToLanguageFile(selectedText as string,'a');
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

    const searchQuery = await vscode.window.showInputBox({
        placeHolder: "Search query",
        prompt: "Search my snippets on Codever",
        value: ''
    });

    if(searchQuery === ''){
        console.log(searchQuery);
        vscode.window.showErrorMessage('A search query is mandatory to execute this action');
      }

    if(searchQuery !== undefined){
        return searchQuery+".php";
    }
}

function addToLanguageFile(selectedText: string, fileName: string)
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
			newContent += `,\r\n\t"${selectedText}" => "${selectedText}"\r\n];`;

			writeFileSync(resourceFilePath, newContent);
		}
	}
	else
		vscode.window.showErrorMessage(`Laravel lang file ${resourceFilePath} not exists on disk`);
}

// this method is called when your extension is deactivated
export function deactivate() { }
