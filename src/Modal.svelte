<script>
	import { createEventDispatcher } from 'svelte';
    import { scale } from 'svelte/transition';
    import Icon from 'fa-svelte';
    import { faTimes } from '@fortawesome/free-solid-svg-icons/';

	const dispatch = createEventDispatcher();
	export let wideModal = false;
	export let zIndex = 0;
</script>

<style>
	.modal-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.3);
		z-index: 1000;
	}
	.modal {
		/*position: fixed;*/
        /*display: block;*/
        /*text-align: left;*/
		/*left: 50%;*/
		/*top: 50%;*/
		/*width: calc(100vw - 4em);*/
		/*width: 600px;*/
		/*min-width: 200px;*/
		/*max-height: calc(100vh - 4em);*/
		/*overflow: auto;*/
		/*transform: translate(-50%,-50%) translateZ(0);*/
		/*padding: 1em;*/
		/*border-radius: 0.2em;*/
		/*background: white;*/
	    /*height: 180px;*/

	    position: fixed;
        display: block;
        text-align: left;
        left: 50%;
        top: 80px;
        width: 600px;
        min-width: 200px;
        max-height: calc(100vh - 4em);
        overflow: auto;
        padding: 1em;
        border-radius: 0.2em;
        background: white;
        height: 180px !important;
        margin-left: -20%;
	}
	.modal.wide {
	    top: 30px;
        width: 100%;
        box-sizing: border-box;
        height: 100% !important;
        margin-left: -50%;

	}
	button {
		display: block;
		cursor: pointer;
	}
	.close-wrapper {
	    text-align: right;
	}
	.header-wrapper {
        display: flex;
        justify-content: space-between;
	}
	.modal-wrapper {
        display: flex;
        flex-direction: column;
	}
</style>
<div class="modal-wrapper">
    <div class='modal-background' on:click='{() => dispatch("close")}'></div>

    <div class='modal' style="z-index:{zIndex ? zIndex : '1001'}; height:{wideModal ? window.innerHeight + 'px' : 'initial'}" class:wide="{wideModal}" transition:scale="{{ y: 200, duration: 200 }}">
        <div class="header-wrapper">
            <div><slot name='header'></slot></div>
            <div class="close-wrapper">
                <span class="close" on:click='{() => dispatch("close")}'><Icon class="icon" icon={faTimes}></Icon></span>
            </div>
        </div>
        <slot></slot>
        <hr>
        <button on:click='{() => dispatch("close")}'>Закрыть</button>
    </div>
</div>
