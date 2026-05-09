import React, { useEffect, useState } from "react";
import { ExternalPathString } from "expo-router";
import {
	View,
	Alert,
} from "react-native";
import TrackerButton from "@/components/tracker-button";
import { useAuth } from "@/library/auth-provider";
import {
	createChild,
	getActiveChildId as getLocalActiveChildId,
} from "@/library/local-store";
import { saveNewChild } from "@/library/remote-store";
import AddChildPopup from "@/components/add-child-popup";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.tabsIndex;


export default function MainTab() {
	type Button = {
		label: string;
		icon: string;
		link: ExternalPathString;
	};

	const buttons: Button[] = [
		{
			label: "Sleep",
			icon: "🌙",
			link: "/sleep" as ExternalPathString,
		},
		{
			label: "Nursing",
			icon: "🍼",
			link: "/nursing" as ExternalPathString,
		},
		{
			label: "Milestone",
			icon: "🌟",
			link: "/milestone" as ExternalPathString,
		},
		{
			label: "Feeding",
			icon: "🍽️",
			link: "/feeding" as ExternalPathString,
		},
		{ label: "Diaper", icon: "🧷", link: "/diaper" as ExternalPathString },
		{ label: "Health", icon: "💚", link: "/health" as ExternalPathString },
	];

	const { isGuest, session, loading } = useAuth();
	const [newChildState, setChildState] = useState(false);
	const [childName, setChildName] = useState("");

	const handleSaveChild = async () => {
		if (isGuest) {
			// GUEST MODE: local-only
			try {
				await createChild(childName);
				setChildState(false);
			} catch {
				Alert.alert("Error", "Could not create the child in guest mode. Please try again");
			}
		} else {
			// SIGNED IN: Supabase connection
			try {
				await saveNewChild(childName);
				setChildState(false); // Close modal
			} catch (error: any) {
				Alert.alert(
					"Error",
					error.message || "An error occurred while saving child data.",
				);
			}
		}

		setChildName("");
	};

	useEffect(() => {
		let cancelled = false;
		const checkChild = async () => {
			if (loading) return;

			if (isGuest) {
				const activeId = await getLocalActiveChildId();
				if (!cancelled) {
					setChildState(!activeId);
				}
			} else {
				if (!session) {
					setChildState(false);
					return;
				}

				// Show new child modal when either activeChildId or legacyChild metadata are non-existent
				const activeChildId = session.user.user_metadata?.activeChildId;
				const legacyActiveChild = session.user.user_metadata?.activeChild;
				setChildState(!(activeChildId || legacyActiveChild));
			}
		};

		checkChild();
		return () => {
			cancelled = true;
		};
	}, [session, isGuest, loading]);

	return (
		<View className="main-container flex-col">
			<View className="flex-row justify-center gap-4 items-center flex-grow">
				<View className="flex-col gap-4">
					<TrackerButton button={buttons[0]} testID={testIDs.sleepButton} />
					<TrackerButton button={buttons[1]} testID={testIDs.nursingButton} />
					<TrackerButton button={buttons[2]} testID={testIDs.milestoneButton} />
				</View>
				<View className="flex-col gap-4">
					<TrackerButton button={buttons[3]} testID={testIDs.feedingButton} />
					<TrackerButton button={buttons[4]} testID={testIDs.diaperButton} />
					<TrackerButton button={buttons[5]} testID={testIDs.healthButton} />
				</View>
				<AddChildPopup
					visible={newChildState}
					childName={childName}
					onChildNameUpdate={setChildName}
					handleSave={handleSaveChild}
					altTitle="Welcome to SimpleBaby"
					altSubtitle="Please add your first child's name below:"
					testID={testIDs.addChildPopup}
				/>
			</View>
		</View>
	);
}
