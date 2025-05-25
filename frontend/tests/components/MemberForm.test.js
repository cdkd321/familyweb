import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import MemberForm from '../../../src/components/members/MemberForm.vue'; // Adjust path
import { useMemberStore } from '../../../src/stores/memberStore'; // To interact with the mock

// Mock Vue Router's <router-link>
const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
};

describe('MemberForm.vue', () => {
  let wrapper;
  let memberStore; // To access the mocked store instance

  const mockMembers = [
    { id: 101, name: 'Parent Candidate 1' },
    { id: 102, name: 'Parent Candidate 2' },
    { id: 103, name: 'Spouse Candidate' },
  ];

  const memberProp = {
    id: 1,
    name: 'Existing Member',
    birth_date: '1990-01-01',
    death_date: '',
    bio: 'A bio.',
    photo_url: 'http://example.com/photo.jpg',
    parent1_id: 101,
    parent2_id: null,
    spouse_id: 103,
  };

  function createWrapper(props = {}, initialStoreState = { members: [...mockMembers] }) {
    wrapper = mount(MemberForm, {
      props: {
        member: null,
        isEditMode: false,
        isSubmitting: false,
        formError: null,
        ...props,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn, // spy on actions
            initialState: {
              member: initialStoreState, // Initial state for the member store
            },
          }),
        ],
        stubs: { // Stub <router-link> to avoid router warnings/errors
          RouterLink: RouterLinkStub,
          'router-link': RouterLinkStub,
        },
      },
    });
    memberStore = useMemberStore(); // Get the instance of the (mocked) store
  }

  beforeEach(() => {
    // Default setup for most tests
    createWrapper();
  });

  // 1. Rendering based on Props
  describe('Rendering based on Props', () => {
    it('renders correctly in create mode', () => {
      createWrapper({ isEditMode: false });
      expect(wrapper.find('input#name').element.value).toBe('');
      expect(wrapper.find('button[type="submit"]').text()).toContain('Create Member');
    });

    it('renders correctly in edit mode with member data', () => {
      createWrapper({ isEditMode: true, member: { ...memberProp } });
      expect(wrapper.find('input#name').element.value).toBe(memberProp.name);
      expect(wrapper.find('input#birth_date').element.value).toBe(memberProp.birth_date);
      expect(wrapper.find('textarea#bio').element.value).toBe(memberProp.bio);
      expect(wrapper.find('select#parent1_id').element.value).toBe(String(memberProp.parent1_id));
      expect(wrapper.find('select#spouse_id').element.value).toBe(String(memberProp.spouse_id));
      expect(wrapper.find('button[type="submit"]').text()).toContain('Update Member');
    });
  });

  // 2. Input Field Interaction
  describe('Input Field Interaction', () => {
    it('updates form data on name input', async () => {
      const nameInput = wrapper.find('input#name');
      await nameInput.setValue('New Name');
      expect(wrapper.vm.formData.name).toBe('New Name');
    });

    it('updates form data on birth_date input', async () => {
      const dateInput = wrapper.find('input#birth_date');
      await dateInput.setValue('2000-05-05');
      expect(wrapper.vm.formData.birth_date).toBe('2000-05-05');
    });
    
    it('updates form data on parent1_id selection', async () => {
        const parentSelect = wrapper.find('select#parent1_id');
        await parentSelect.setValue(mockMembers[0].id); // Select first mock member
        expect(wrapper.vm.formData.parent1_id).toBe(mockMembers[0].id);
    });
  });

  // 3. Dropdowns/Selectors
  describe('Dropdowns/Selectors', () => {
    it('populates parent and spouse dropdowns from memberStore', () => {
      // memberStore.members is set via createTestingPinia's initialState
      expect(memberStore.members).toEqual(mockMembers);
      
      const parentOptions = wrapper.findAll('select#parent1_id option');
      // +1 for the "-- Select Parent 1 --" option
      expect(parentOptions.length).toBe(mockMembers.length + 1); 
      expect(parentOptions[1].text()).toBe(mockMembers[0].name);

      const spouseOptions = wrapper.findAll('select#spouse_id option');
      // +1 for the "-- Select Spouse --" option
      expect(spouseOptions.length).toBe(mockMembers.length + 1);
      expect(spouseOptions[1].text()).toBe(mockMembers[0].name); // Same list used for spouses
    });

    it('excludes current member from parent/spouse dropdowns in edit mode', () => {
      const currentMemberForEditing = { id: mockMembers[0].id, name: mockMembers[0].name };
      createWrapper(
        { isEditMode: true, member: currentMemberForEditing },
        { members: [...mockMembers] } // Store has all mock members
      );
      
      // The computed properties availableParents/availableSpouses should filter out currentMemberForEditing
      const parentOptions = wrapper.findAll('select#parent1_id option');
      expect(parentOptions.length).toBe(mockMembers.length); // No current member + default "-- Select --"
      parentOptions.forEach(option => {
        if (option.element.value && option.element.value !== "null") { // Check actual value options
             expect(parseInt(option.element.value)).not.toBe(currentMemberForEditing.id);
        }
      });
    });
  });

  // 4. Form Submission
  describe('Form Submission', () => {
    it('emits submit event with correct payload on create', async () => {
      const formData = {
        name: 'John Doe',
        birth_date: '1985-06-15',
        death_date: null,
        bio: 'Test bio',
        photo_url: 'http://photo.com/jd.jpg',
        parent1_id: mockMembers[0].id,
        parent2_id: null,
        spouse_id: mockMembers[1].id,
      };

      await wrapper.find('input#name').setValue(formData.name);
      await wrapper.find('input#birth_date').setValue(formData.birth_date);
      await wrapper.find('textarea#bio').setValue(formData.bio);
      await wrapper.find('input#photo_url').setValue(formData.photo_url);
      await wrapper.find('select#parent1_id').setValue(formData.parent1_id);
      await wrapper.find('select#spouse_id').setValue(formData.spouse_id);
      
      await wrapper.find('form').trigger('submit.prevent');

      expect(wrapper.emitted().submit).toBeTruthy();
      expect(wrapper.emitted().submit[0][0]).toEqual(formData);
    });

    it('emits submit event with correct payload on edit', async () => {
        createWrapper({ isEditMode: true, member: { ...memberProp } });
        
        const newName = "Updated Existing Member";
        await wrapper.find('input#name').setValue(newName);
        // Simulate changing another field, e.g., bio
        const newBio = "Updated bio information.";
        await wrapper.find('textarea#bio').setValue(newBio);

        await wrapper.find('form').trigger('submit.prevent');

        expect(wrapper.emitted().submit).toBeTruthy();
        const emittedData = wrapper.emitted().submit[0][0];
        expect(emittedData.name).toBe(newName);
        expect(emittedData.bio).toBe(newBio);
        // Other fields should remain as per memberProp or be null if cleared
        expect(emittedData.birth_date).toBe(memberProp.birth_date);
        expect(emittedData.parent1_id).toBe(memberProp.parent1_id);
      });
  });

  // 5. Validation (Client-side)
  describe('Client-side Validation', () => {
    it('prevents submission if parent1 and parent2 are the same', async () => {
        // Mock window.alert as it's used in the component for this validation
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        await wrapper.find('select#parent1_id').setValue(mockMembers[0].id);
        await wrapper.find('select#parent2_id').setValue(mockMembers[0].id); // Same ID

        // Check if submit button becomes disabled or if form submission is prevented
        expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
        
        await wrapper.find('form').trigger('submit.prevent');
        
        expect(alertSpy).toHaveBeenCalledWith("Parent 1 and Parent 2 cannot be the same person.");
        expect(wrapper.emitted().submit).toBeFalsy(); // Submit should not be emitted
        
        alertSpy.mockRestore(); // Clean up spy
    });

    it('requires name field (HTML5 validation)', async () => {
        // HTML5 'required' attribute is tested by trying to submit an empty form
        // This test is more about ensuring the attribute is there.
        // Actual browser validation behavior isn't fully testable in JSDOM/happy-dom easily.
        expect(wrapper.find('input#name').attributes('required')).toBeDefined();
        // To test if submit is blocked by HTML5 validation, one might check form.checkValidity()
        // but that's often tricky with test environments. We'll rely on the attribute.
    });
  });

  // 6. Loading/Error Props
  describe('Loading/Error Props', () => {
    it('disables submit button when isSubmitting is true', async () => {
      await wrapper.setProps({ isSubmitting: true });
      expect(wrapper.find('button[type="submit"]').element.disabled).toBe(true);
    });

    it('displays error message when formError is set', async () => {
      const errorMessage = "An API error occurred.";
      await wrapper.setProps({ formError: errorMessage });
      expect(wrapper.find('.error-message').exists()).toBe(true);
      expect(wrapper.find('.error-message').text()).toBe(errorMessage);
    });
  });
});
```
