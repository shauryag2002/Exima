import React, { Component, ReactNode } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SafeWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("SafeWrapper caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleShowError = () => {
    if (this.state.error) {
      Alert.alert(
        "Error Details",
        this.state.error.message || "An unknown error occurred",
        [{ text: "OK" }]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-neutral-950 justify-center items-center px-6">
          <Text className="text-red-400 text-6xl mb-4">⚠️</Text>
          <Text className="text-white text-xl font-semibold mb-2 text-center">
            Something went wrong
          </Text>
          <Text className="text-neutral-400 text-center mb-6">
            The app encountered an error. This might be due to permission
            issues.
          </Text>

          <View className="space-y-3 w-full max-w-sm">
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-xl"
              onPress={this.handleRetry}
            >
              <Text className="text-white font-semibold text-center">
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-neutral-800 px-6 py-3 rounded-xl"
              onPress={this.handleShowError}
            >
              <Text className="text-neutral-300 font-medium text-center">
                Show Error Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
