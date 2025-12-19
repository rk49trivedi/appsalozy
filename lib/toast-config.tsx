/**
 * Custom Toast Configuration
 * Modern toast styling for the app with support for long messages
 * Uses ScrollView for very long content to ensure full message visibility
 */
import { ScrollView, Text, View } from 'react-native';

// Custom toast component with scrollable content for long messages
const CustomScrollableToast = ({ 
  type, 
  text1, 
  text2, 
  props 
}: { 
  type: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
  props: any;
}) => {
  // Determine if message is long enough to require scrolling
  const messageLength = (text1?.length || 0) + (text2?.length || 0);
  const isLongMessage = messageLength > 150;
  
  const styles = {
    success: {
      borderColor: '#22C55E',
      backgroundColor: '#F0FDF4',
      titleColor: '#166534',
      messageColor: '#15803D',
    },
    error: {
      borderColor: '#EF4444',
      backgroundColor: '#FEF2F2',
      titleColor: '#991B1B',
      messageColor: '#DC2626',
    },
    info: {
      borderColor: '#3B82F6',
      backgroundColor: '#EFF6FF',
      titleColor: '#1E40AF',
      messageColor: '#2563EB',
    },
  };

  const style = styles[type];

  const content = (
    <View style={{ flex: 1 }}>
      {text1 && (
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: style.titleColor,
            marginBottom: text2 ? 6 : 0,
            flexWrap: 'wrap',
          }}
        >
          {text1}
        </Text>
      )}
      {text2 && (
        <Text
          style={{
            fontSize: 13,
            color: style.messageColor,
            lineHeight: 18,
            flexWrap: 'wrap',
          }}
        >
          {text2}
        </Text>
      )}
    </View>
  );

  // For short messages, we want a compact toast at bottom
  // For long messages, this shouldn't be used (inline error should be shown instead)
  return (
    <View
      style={{
        borderLeftColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        minHeight: 60,
        maxHeight: isLongMessage ? 320 : 180,
        borderLeftWidth: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 20,
        zIndex: 9999,
        width: '92%',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          flex: 1,
        }}
      >
        {isLongMessage ? (
          <ScrollView
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={{ maxHeight: 300 }}
            contentContainerStyle={{ paddingRight: 4 }}
            bounces={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: (props: any) => (
    <CustomScrollableToast
      type="success"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),

  error: (props: any) => (
    <CustomScrollableToast
      type="error"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),

  info: (props: any) => (
    <CustomScrollableToast
      type="info"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),
};

