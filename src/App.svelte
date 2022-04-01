<script>
	import ProgramTable from './ProgramTable.svelte';
    import { slide } from 'svelte/transition';
    import Modal from './Modal.svelte';
    import { isDirty, readMode } from './store/programTableStore.js';
    import { generateReport } from './services/services';

    let showModal = false;

    function onClose() {
        if ($isDirty) {
            const confirmClose = confirm("Вы уверены, что хотите выйти без сохранения?");
            if (confirmClose) {
                showModal = false;
                generateReport();
            }
        } else {
            showModal = false;
            generateReport();
        }
        location.reload();
    }
	window.addEventListener("beforeunload", function (e) {
		if ($isDirty) {
			e.returnValue = '';
		}
	});

    const urlParams = new URLSearchParams(window.location.search);
    for (let p of urlParams) {
        if (p[0] === 'readMode') {
            $readMode = +p[1];
        }
    }
    if ($readMode) {
        showModal = true;
    }
</script>

<style>
.calculate-btn {
    margin: 25px;
}
.header {
    margin-left: 10px;
}
</style>

<svelte:head>
	<title>Расчетная таблица</title>
</svelte:head>

<button class="calculate-btn btn btn-primary" on:click="{() => showModal = true}">Расчетная таблица</button>
{#if showModal}
	<Modal wideModal="{true}" on:close="{(e) => onClose()}">
		<h2 class="header" slot="header">
			Расчетная таблица
		</h2>
        <div>
            <ProgramTable readMode="{readMode}"></ProgramTable>
        </div>
	</Modal>
{/if}