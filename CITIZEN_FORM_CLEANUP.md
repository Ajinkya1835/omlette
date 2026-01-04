# Citizen Report Form Cleanup & Map UX Improvements

## Changes Implemented

### ✅ 1. Removed "Nearby Properties" Tab
- **File**: `frontend/src/pages/Citizen.jsx`
- **Changes**:
  - Removed tab navigation buttons for "Report Violation" and "Nearby Properties"
  - Removed `activeTab` state variable
  - Removed `CitizenNearbyProperties` component import
  - Removed conditional rendering based on activeTab
  - Form now displays directly without tabs

### ✅ 2. Show All Properties Directly on Map (Main Form)
- **File**: `frontend/src/components/MapPicker.jsx`
- **Changes**:
  - Added `properties` prop (array of property objects)
  - Added `propertyMarkersRef` to track property markers
  - Created new `useEffect` to display property markers when properties array changes
  - Each property displays as a blue marker with property name and type
  - Info window shows on marker click with property details
  - Updated cleanup to remove all property markers on unmount

### ✅ 3. Clean Property Dropdown Label & Markers
- **File**: `frontend/src/pages/Citizen.jsx`
- **Changes**:
  - Removed "Optional" from Related Property label → Now just "Related Property"
  - Removed numbered prefix "0." from dropdown label
  - Removed all numbered prefixes from form field labels:
    - "1. Select Category:" → "Select Category"
    - "2. Select Violation Type:" → "Select Violation Type"
    - "3. Description (Optional):" → "Description (Optional)"
    - "4. Upload Evidence..." → "Upload Evidence..."
    - "5. Set Violation Location:" → "Set Violation Location & View Properties"
  - Labels now display cleanly without numbering

### ✅ 4. Fixed Description Textarea Font Issue
- **File**: `frontend/src/pages/Citizen.jsx`
- **Changes**:
  - Updated textarea fontFamily from `"inherit"` to explicit system fonts:
    ```css
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    ```
  - Now matches the rest of the form styling
  - Prevents monospace or browser-default fonts

### ✅ 5. Removed "Detect My Location" Button
- **File**: `frontend/src/components/MapPicker.jsx`
- **Changes**:
  - Completely removed the "Detect My Location" button from the map picker header
  - Removed `handleDetectLocation` function
  - Removed related geolocation logic from MapPicker
  - Location detection still happens automatically on page load in Citizen.jsx
  - Updated hint text to include property information:
    - "Click map or drag marker to set location. Blue markers show registered properties."

## Map Integration Details

### Properties Display on Map
- All ACTIVE properties from the system are displayed with blue markers
- Clicking a property marker shows an info window with:
  - Property Name
  - Property Type
- User's location marker remains red and draggable
- Properties refresh whenever the properties array updates

### Form Flow
1. Properties dropdown for optional selection (top of form)
2. Category selection
3. Violation type selection
4. Description (optional)
5. Evidence upload
6. **Map picker with all properties visible** ← Enhanced
7. PropertyMapSelector for visual property linking (shown conditionally)
8. Submit button

## Technical Details

### MapPicker Component
- **Props**:
  - `latitude`: User's current latitude
  - `longitude`: User's current longitude
  - `onLocationChange`: Callback when location changes
  - `properties`: Array of property objects with latitude, longitude, propertyName, propertyType

- **Marker Types**:
  - Red marker: User's violation location (draggable)
  - Blue markers: All registered properties (clickable for info)

### Backward Compatibility
- All changes are non-breaking
- Existing form submission logic unchanged
- Property linking still optional via dropdown
- No database schema changes
- No API changes required

## Testing Checklist
- [ ] Properties appear as blue markers on the map
- [ ] Clicking property marker shows name and type
- [ ] User location marker remains draggable
- [ ] Form can be submitted with or without property selection
- [ ] No numbered prefixes appear in form
- [ ] Description textarea uses correct font
- [ ] Nearby Properties tab/page removed
- [ ] All form fields display cleanly
- [ ] Responsive design maintained

## Files Modified
1. `frontend/src/pages/Citizen.jsx` - Form cleanup and structure
2. `frontend/src/components/MapPicker.jsx` - Property markers and button removal
