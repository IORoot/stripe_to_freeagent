<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	interface RegexPattern {
		id: string;
		pattern: string;
		description: string;
		enabled: boolean;
	}

	export let regex_patterns: RegexPattern[] = [];

	let new_pattern = '';
	let new_description = '';
	let editing_id: string | null = null;
	let edit_pattern = '';
	let edit_description = '';

	function add_pattern() {
		if (!new_pattern.trim()) return;

		const pattern: RegexPattern = {
			id: Date.now().toString(),
			pattern: new_pattern.trim(),
			description: new_description.trim() || `Pattern: ${new_pattern.trim()}`,
			enabled: true
		};

		regex_patterns = [...regex_patterns, pattern];
		new_pattern = '';
		new_description = '';
		dispatch('patterns_updated', regex_patterns);
	}

	function delete_pattern(id: string) {
		regex_patterns = regex_patterns.filter(p => p.id !== id);
		dispatch('patterns_updated', regex_patterns);
	}

	function toggle_pattern(id: string) {
		regex_patterns = regex_patterns.map(p => 
			p.id === id ? { ...p, enabled: !p.enabled } : p
		);
		dispatch('patterns_updated', regex_patterns);
	}

	function start_edit(pattern: RegexPattern) {
		editing_id = pattern.id;
		edit_pattern = pattern.pattern;
		edit_description = pattern.description;
	}

	function save_edit() {
		if (!editing_id) return;

		regex_patterns = regex_patterns.map(p => 
			p.id === editing_id 
				? { ...p, pattern: edit_pattern.trim(), description: edit_description.trim() }
				: p
		);
		
		editing_id = null;
		edit_pattern = '';
		edit_description = '';
		dispatch('patterns_updated', regex_patterns);
	}

	function cancel_edit() {
		editing_id = null;
		edit_pattern = '';
		edit_description = '';
	}

	function test_regex(pattern: string): boolean {
		try {
			new RegExp(pattern);
			return true;
		} catch {
			return false;
		}
	}
</script>

<div class="space-y-4">
	<!-- Add New Pattern -->
	<div class="space-y-3">
		<h3 class="text-lg font-medium text-gray-900">Add New Pattern</h3>
		<div class="grid grid-cols-1 gap-3">
			<input
				type="text"
				bind:value={new_pattern}
				placeholder="Enter regex pattern (e.g., STRIPE|Sale|Fee)"
				class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
			<input
				type="text"
				bind:value={new_description}
				placeholder="Description (optional)"
				class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
			<button
				on:click={add_pattern}
				disabled={!new_pattern.trim()}
				class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
			>
				Add Pattern
			</button>
		</div>
	</div>

	<!-- Pattern List -->
	<div class="space-y-3">
		<h3 class="text-lg font-medium text-gray-900">Patterns ({regex_patterns.length})</h3>
		{#if regex_patterns.length === 0}
			<p class="text-gray-500 text-sm">No patterns added yet.</p>
		{:else}
			<div class="space-y-2">
				{#each regex_patterns as pattern (pattern.id)}
					<div class="border border-gray-200 rounded-lg p-3 {pattern.enabled ? 'bg-white' : 'bg-gray-50'}">
						{#if editing_id === pattern.id}
							<!-- Edit Mode -->
							<div class="space-y-2">
								<input
									type="text"
									bind:value={edit_pattern}
									class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<input
									type="text"
									bind:value={edit_description}
									class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<div class="flex space-x-2">
									<button
										on:click={save_edit}
										disabled={!edit_pattern.trim() || !test_regex(edit_pattern)}
										class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-300"
									>
										Save
									</button>
									<button
										on:click={cancel_edit}
										class="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
									>
										Cancel
									</button>
								</div>
								{#if !test_regex(edit_pattern)}
									<p class="text-red-500 text-xs">Invalid regex pattern</p>
								{/if}
							</div>
						{:else}
							<!-- View Mode -->
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<div class="flex items-center space-x-2">
										<input
											type="checkbox"
											checked={pattern.enabled}
											on:change={() => toggle_pattern(pattern.id)}
											class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
											{pattern.pattern}
										</span>
									</div>
									<p class="text-sm text-gray-600 mt-1">{pattern.description}</p>
								</div>
								<div class="flex space-x-1">
									<button
										on:click={() => start_edit(pattern)}
										class="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
									>
										Edit
									</button>
									<button
										on:click={() => delete_pattern(pattern.id)}
										class="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
									>
										Delete
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Help Text -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
		<h4 class="text-sm font-medium text-blue-900 mb-1">Regex Tips:</h4>
		<ul class="text-xs text-blue-800 space-y-1">
			<li>• Use <code class="bg-blue-100 px-1 rounded">STRIPE</code> to match Stripe transactions</li>
			<li>• Use <code class="bg-blue-100 px-1 rounded">Sale|Fee</code> to match multiple terms</li>
			<li>• Use <code class="bg-blue-100 px-1 rounded">^Sale</code> to match start of text</li>
			<li>• Use <code class="bg-blue-100 px-1 rounded">\.com$</code> to match end of text</li>
		</ul>
	</div>
</div> 