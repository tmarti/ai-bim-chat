import { IMessageManagerService } from "../state/MessageManagerService";
import { generateMessageId } from "./getMessageId";

export enum SuggestionLink {
    IsolateObject = '#isolate-object',
    HideObject = '#hide-object',
    ShowObjectData = '#show-object-data',
    ShowObjectTypesTable = '#show-object-types-table',
    ShowTopVolumeObjects = '#show-top-volume-objects',
    CountObjectsInLevels = '#count-objects-in-levels',
    IsolateObjectsIn2ndFloor = '#isolate-objects-in-2nd-floor',
    KeepWindowsAndDoorsIn1stFloor = '#keep-windows-and-doors-in-1st-floor',
    HighlightWindowsAndDoors = '#highlight-windows-and-doors',
    TakeSnapshot = '#take-snapshot',
    ColorizeAllWalls = '#colorize-all-walls',
}

/**
 * Handles the click on a suggestion link by adding a message to the message manager.
 * 
 * The href is expected to be a hash starting with '#' followed by the suggestion name.
 * 
 * The suggestion name is used to determine which message to add to the message manager.
 * 
 * @param href - The href of the suggestion link
 * @param messageManager - The message manager to add the message to
 */
export const handleSuggestionLink = (href: SuggestionLink, messageManager: IMessageManagerService) => {
    switch (href) {
        case SuggestionLink.IsolateObject:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Isolate the last mentioned object',
                who: 'user',
            })
            break;
        case SuggestionLink.HideObject:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Hide the last mentioned object',
                who: 'user',
            })
            break;
        case SuggestionLink.ShowObjectData:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Show me the most relevant model database properties for the last selected object in table format',
                who: 'user',
            })
            break;
        case SuggestionLink.ShowObjectTypesTable:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Show the amount of different objects per type in table format',
                who: 'user',
            })
            break;
        case SuggestionLink.ShowTopVolumeObjects:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Show a pie chart containing the aggregated volume for the top 4 object types, ignoring spaces',
                who: 'user',
            })
            break;
        case SuggestionLink.CountObjectsInLevels:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Show a bar chart containing the amount of objects per level, ignoring spaces. Avoid to count objects not belonging to a level',
                who: 'user',
            })
            break;
        case SuggestionLink.KeepWindowsAndDoorsIn1stFloor:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'In the 1st floor, hide all objects except windows and doors',
                who: 'user',
            })
            break;
        case SuggestionLink.IsolateObjectsIn2ndFloor:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Search all objects in the 2nd floor and isolate them',
                who: 'user',
            })
            break;
        case SuggestionLink.HighlightWindowsAndDoors:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Search all windows and doors and highlight them',
                who: 'user',
            })
            break;
        case SuggestionLink.TakeSnapshot:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Take a snapshot in the viewer',
                who: 'user',
                isolatedMessage: true,
            })
            break;
        case SuggestionLink.ColorizeAllWalls:
            messageManager.addMessage({
                id: generateMessageId(),
                text: 'Colorize all walls with a light green color',
                who: 'user',
            })
            break;
        default:
            href satisfies never;
            break;
    }
}