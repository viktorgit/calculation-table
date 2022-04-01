<script>
    import Icon from 'fa-svelte';
    import { faTimes } from '@fortawesome/free-solid-svg-icons/';
    import { createEventDispatcher } from 'svelte';

    export let items = [];
    export let selectedItems = [];
    export let placeholder = '';
    let showItemsClass = false;
    let inputValue = '';
    const dispatch = createEventDispatcher();

    function showItems() {
        if (!items.length) {
            return;
        }
        showItemsClass = true;
    }
    function hideItems() {
      showItemsClass = false;
    }
    function selectItem(itemValue) {
        showItemsClass = false;
        const item = items.find(s => s.value === itemValue);
        selectedItems.push(item);
        selectedItems = selectedItems;
        const indexOfSelecteditem = items.findIndex(s => s.value === itemValue);
        items.splice(indexOfSelecteditem, 1);
        items = items;
        dispatch('onItemSelect', {
            items: items,
            selectedItems: selectedItems
        });
    }
    function removeItem(item) {
        const indexOfRemovedItem = selectedItems.findIndex(s => s.value === item.value);
        selectedItems.splice(indexOfRemovedItem, 1);
        selectedItems = selectedItems;
        items.push(item);
        items = items;

    }
</script>

<style>
    .items {
        display: none;
    }
    .items.show {
        display: block;
    }
    .select-wrapper {
        position: relative;
        width: 200px;
    }
    input, .items {
        box-sizing: border-box;
        border-right: 1px solid #dedede;
        border-left: 1px solid #dedede;
        width: 100%;
    }
    .input {
        cursor: pointer;
        position: relative;
        z-index: 1001;
        display: flex;
        min-height: 23px;
        line-height: 1.6;
        font-size: 12px;
        padding: 0 0 0 5px;
        max-width: 230px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 2px;
        flex-wrap: wrap;
    }
    .items {
        background: #fff;
        position: absolute;
        z-index: 1001;
        top: 23px;
    }
    .items__item {
        padding: 3px;
        border-bottom: 1px solid #dedede;
        white-space: initial;
        line-height: 1.5;
        cursor: pointer;
    }
    .items__item:hover {
        background-color: #f1f1f1;
    }
    .remove-item {
        position: relative;
        top: 2px;
    }
    .backdrop {
        display: none;
        z-index: 1000;
        top: 0;
        left: 0;
        position: fixed;
        background: transparent;
        width: 100%;
        height: 100%;
    }
    .backdrop.show {
        display: block;
    }
    .selected-item {
        white-space: nowrap;
        overflow: hidden;
        background: #f1f1f1;
        max-width: 61px;
        border-radius: 4px;
        margin-right: 2px;
        margin-bottom: 2px;
        text-overflow: ellipsis;
    }
</style>

<div class="select-wrapper">
    <div class="backdrop" class:show="{showItemsClass}" on:click="{(e) => {hideItems()}}"></div>
    <div class="input" on:click="{showItems}" on:keydown="{(e) => {e.preventDefault(); return false;}}">
        {#if selectedItems && selectedItems.length}
            {#each selectedItems as i}
                <div class="selected-item" title="{i.name}">
                    <span class="remove-item" on:click="{(e) => {e.stopPropagation(); removeItem(i)}}"><Icon class="icon" icon={faTimes}></Icon></span>&nbsp;{i.name}
                </div>
            {/each}
        {:else}
            {placeholder}
        {/if}
    </div>
    <div class="items" class:show="{showItemsClass}">
        {#each items as item}
            <div on:click="{(e) => { selectItem(item.value) } }" class="items__item" value={item.value}>
                {item.name}
            </div>
        {/each}
    </div>
</div>
