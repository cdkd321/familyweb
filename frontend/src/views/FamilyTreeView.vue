<template>
  <div class="family-tree-view">
    <h1>Family Tree</h1>

    <div v-if="memberStore.loading" class="loading">Loading family members...</div>
    <div v-if="memberStore.error" class="error-message">
      Error fetching members: {{ memberStore.error }}
    </div>

    <div v-if="!memberStore.loading && !memberStore.error && treeRoots.length === 0" class="no-members">
      No members found to display in the tree. Add members to see the tree.
    </div>

    <div class="tree-container" v-if="!memberStore.loading && !memberStore.error && treeRoots.length > 0">
      <ul class="tree-root">
        <TreeNode v-for="rootNode in treeRoots" :key="rootNode.id" :node="rootNode" />
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMemberStore } from '@/stores/memberStore';

const memberStore = useMemberStore();
const treeRoots = ref([]); // Array to hold root nodes of the tree(s)

// Placeholder for TreeNode component - will be created later or integrated
const TreeNode = {
  name: 'TreeNode',
  props: ['node'],
  template: `
    <li>
      <div class="node-content">
        <span>{{ node.name }} (ID: {{ node.id }})</span>
        <router-link :to="'/members/' + node.id" class="view-details-link">(View Details)</router-link>
      </div>
      <ul v-if="node.children && node.children.length > 0">
        <TreeNode v-for="childNode in node.children" :key="childNode.id" :node="childNode" />
      </ul>
    </li>
  `
};


function buildTree(members) {
  const membersMap = {};
  members.forEach(member => {
    membersMap[member.id] = { ...member, children: [] };
  });

  const roots = [];
  Object.values(membersMap).forEach(memberNode => {
    // A member is a root if they have no parents or their parents are not in the current dataset
    let isRoot = true;

    if (memberNode.parent1_id && membersMap[memberNode.parent1_id]) {
      membersMap[memberNode.parent1_id].children.push(memberNode);
      isRoot = false;
    }
    // Ensure a child is not added twice if both parents are in the tree from different branches (less common in simple trees)
    if (memberNode.parent2_id && membersMap[memberNode.parent2_id]) {
      if (!membersMap[memberNode.parent2_id].children.find(c => c.id === memberNode.id)) {
        membersMap[memberNode.parent2_id].children.push(memberNode);
      }
      isRoot = false;
    }
    
    // If after checking parents, it's still considered a root (no known parents in the set)
    if (isRoot) {
        // Further check: if this node is already a child of someone (e.g. parent1 was processed, parent2 was not in dataset)
        // this can be complex. A simpler root definition: no parent1_id AND no parent2_id, OR parents not in dataset.
        let trulyRoot = true;
        if (memberNode.parent1_id && membersMap[memberNode.parent1_id]) trulyRoot = false;
        if (memberNode.parent2_id && membersMap[memberNode.parent2_id]) trulyRoot = false;
        
        if(trulyRoot) {
            roots.push(memberNode);
        }
    }
  });
  
  // Handle cases where a node might be added to roots but also as a child if one parent is not in dataset.
  // This simple approach might list some nodes as roots if their parents are not in `membersMap`.
  // A more robust way might be to ensure that if a node is a child of *any* node in the map, it's not a root.
  const childIds = new Set();
  Object.values(membersMap).forEach(m => {
      m.children.forEach(c => childIds.add(c.id));
  });

  return roots.filter(r => !childIds.has(r.id) || 
    ((!r.parent1_id || !membersMap[r.parent1_id]) && (!r.parent2_id || !membersMap[r.parent2_id]))
  );
}


onMounted(async () => {
  await memberStore.fetchAllMembers();
  if (!memberStore.error && memberStore.members.length > 0) {
    treeRoots.value = buildTree(memberStore.members);
  } else if (memberStore.members.length === 0 && !memberStore.error) {
    treeRoots.value = []; // Ensure tree is empty if no members
  }
});
</script>

<style scoped>
.family-tree-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error-message, .no-members {
  text-align: center;
  padding: 20px;
  border-radius: 5px;
}
.loading { color: #007bff; }
.error-message { color: #dc3545; background-color: #f8d7da; }
.no-members { color: #666; }

.tree-container {
  margin-top: 20px;
  text-align: left; /* Adjust as needed for tree layout */
}

/* Basic styling for nested list tree */
.tree-root, .tree-root ul {
  list-style-type: none;
  padding-left: 20px; /* Indentation for children */
}

.tree-root li {
  margin: 10px 0;
}

.node-content {
  padding: 8px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: inline-block; /* Or block if you want full width nodes */
}

.node-content .view-details-link {
  margin-left: 10px;
  font-size: 0.8em;
  color: #007bff;
}

/* You might need more sophisticated CSS for lines if using a pure HTML/CSS approach beyond simple nesting */
</style>
