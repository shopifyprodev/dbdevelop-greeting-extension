import { useState, useEffect } from "react";
import {
  Image,
  InlineLayout,
  Text,
  useAppMetafields,
  Icon,
  Modal,
  TextBlock,
  Pressable,
  View,
  BlockSpacer,
  Grid,
  Style,
  BlockLayout,
  TextField,
  BlockStack,
  ScrollView,
  Button,
  InlineSpacer,
  useApplyAttributeChange,
  useAttributes,
  Banner,
  Heading,
  Link,
  useApi,
  useSelectedPaymentOptions,
  useApplyDiscountCodeChange, reactExtension, Spinner
} from "@shopify/ui-extensions-react/checkout";

const MAX_GREETING_CHAR = 500;

const checkout = reactExtension("purchase.checkout.block.render", () => <App />);
export { checkout };


const cartLine = reactExtension("purchase.checkout.cart-line-list.render-after", () => <App />);
export { cartLine };

function App() {
  const { extension, ui } = useApi(); // GET THE EXTENSION POINT WHERE IT HAS BEEN RENDERED

  const currentCartAttribs = useAttributes(); // FETCH ALL CART ATTRIBUTES

  const [appStatus, setAppStatus] = useState();

  const getGreetingAppMeta = useAppMetafields({ namespace: "greetingCardApp", key: "settings" }); // FETCH ALL THE GREETING CARDS DATA
  console.log(getGreetingAppMeta);
  useEffect(() => {
    if (getGreetingAppMeta && getGreetingAppMeta.length > 0) {
      const metafield = getGreetingAppMeta[0].metafield;
      if (metafield && metafield.value) {
        try {
          // Ensure that metafield.value is a string
          if (typeof metafield.value === 'string') {
            const parsedValue = JSON.parse(metafield.value);
            if (parsedValue && parsedValue.appStatus) {
              setAppStatus(parsedValue.appStatus);
            } else {
              console.error("Parsed value does not contain appStatus");
            }
          } else {
            console.error("Metafield value is not a string");
          }
        } catch (error) {
          console.error("Error parsing metafield value:", error);
        }
      } else {
        console.error("Metafield value is undefined or null");
      }
    }
  }, [getGreetingAppMeta]);

  const [localCheckoutMetaData, setlocalCheckoutMetaData] = useState([]); // STATE TO GET THE FETCHED METAFIELDS FROM SHOPIFY


  const addOrChangeAttribs = useApplyAttributeChange(); // FUNCTION TO ADD OR CHANGE ATTRIBUTES


  const [singleGreetingCardStatus, setsingleGreetingCardStatus] = useState(false); // STATE USED TO MANAGE OPENING AND CLOSING OF SINGLE GREETING CARD INSIDE THE MODAL


  const [greetingSaveButLoadingStatus, setgreetingSaveButLoadingStatus] = useState(false); // STATE USED TO MANAGE THE LOADING SPINNER ON THE MODAL SAVE BUTTON


  const [greetingRemoveButLoadingStatus, setgreetingRemoveButLoadingStatus] = useState(false); // STATE USED TO MANAGE THE LOADING SPINNER ON THE MODAL REMOVE BUTTON


  const [userAddedgreetingCardMsgData, setuserAddedgreetingCardMsgData] = useState(""); // STATE USED TO MANAGE GREETING TEXT ADDED BY USER, USED TO GET USER MESSAGE AND SETTING PRESET MESSAGES


  const [userAddedgreetingCardMsgDataError, setuserAddedgreetingCardMsgDataError] = useState(false); // STATE USED TO SHOW ERROR IF THE USER EXCEEDS MAXIMUM WORD LIMIT IN TEXTAREA


  const [userAddedgreetingCardNoMsgDataError, setuserAddedgreetingCardNoMsgDataError] = useState(false); // STATE USED TO SHOW ERROR IF THE USER HAS NOT ADDED ANY VALUE IN THE TEXTAREA


  const [currentOpenedGreetingCardData, setGreetingCardData] = useState([]); // STATE USED TO GET AND SET DATA OF CURRENT GREETING CARD OPENED BY USER

  const [categoriesData, setCategoriesData] = useState([]); // NEW: categories from metafield
  const [selectedCategory, setSelectedCategory] = useState(null); // NEW: currently selected category object
  const [modalView, setModalView] = useState('categories'); // NEW: 'categories' | 'cards' | 'single'

  const [charactersLeft, setCharactersLeft] = useState();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [spinner, setSpinner] = useState(false);


  // SET APP METADATA AND PARSE GREETING CARDS DATA START
  useEffect(() => {
    if (getGreetingAppMeta.length > 0 && localCheckoutMetaData.length < 1) {
      setlocalCheckoutMetaData(getGreetingAppMeta); // SET THE FETCHED METAFIELDS DATA TO LOCAL VAR
    }
  }, [getGreetingAppMeta, localCheckoutMetaData.length]);

  useEffect(() => {
    if (localCheckoutMetaData.length > 0 && categoriesData.length === 0) {
      try {
        const parsedSettings = JSON.parse(localCheckoutMetaData[0]['metafield']['value']);
        // categories-based structure
        if (parsedSettings && parsedSettings.greetingCardsData && parsedSettings.greetingCardsData.categories) {
          // Filter categories to only show active ones (status === "1" or status === 1)
          const activeCategories = parsedSettings.greetingCardsData.categories.filter(
            (cat) => cat.status === "1" || cat.status === 1
          );
          setCategoriesData(activeCategories);
        }
      } catch (error) {
        console.error("Error parsing metafield value:", error);
      }
    }
  }, [localCheckoutMetaData, categoriesData.length]);
  // SET APP METADATA AND PARSE GREETING CARDS DATA END

  // Get allGreetingCardsData for fallback (computed during render)
  let allGreetingCardsData = [];
  if (localCheckoutMetaData.length > 0) {
    try {
      const parsedSettings = JSON.parse(localCheckoutMetaData[0]['metafield']['value']);
      allGreetingCardsData = parsedSettings["greetingCardsDataFlat"] || []; // may be undefined; used only as fallback
    } catch (error) {
      // Silently fail, allGreetingCardsData will remain empty array
    }
  }


  // FUNCTION TO CLOSE SINGLE OPENED CARD INSIDE THE MODAL ON MODAL CLOSE START
  const handleGreetingCardModal = () => {
    setCharactersLeft(0);
    setsingleGreetingCardStatus(false); // CLOSE THE SINGLE OPENED GREETING CARD
    setModalView('categories');
    setSelectedCategory(null);
  }



  // FUNCTION TO OPEN AND SET THE DATA OF GREETING CARD SELECTED BY USER START
  const openUserSelectedGreetingCard = (data) => {
    setGreetingCardData(data);
    setsingleGreetingCardStatus(true);
    setuserAddedgreetingCardMsgData(""); // CLEAR THE PREVIOUS USER ADDED MESSAGE
    setModalView('single');
  }
  // FUNCTION TO OPEN AND SET THE DATA OF GREETING CARD SELECTED BY USER START


  // FUNCTION TO MANAGE THE SETTING OF PRESETS TO TEXTAREA START
  // const setGreetingToTextarea = (preset) => {
  //   if (!preset) return;

  //   const currentMessage = userAddedgreetingCardMsgData || "";
  //   const remaining = MAX_GREETING_CHAR - currentMessage.length;

  //   if (remaining <= 0) {
  //     setCharactersLeft(0);
  //     setuserAddedgreetingCardMsgDataError(true);
  //     return;
  //   }

  //   const trimmedPreset = preset.slice(0, remaining);
  //   const nextMessage = currentMessage + trimmedPreset;
  //   const nextRemaining = MAX_GREETING_CHAR - nextMessage.length;

  //   setuserAddedgreetingCardMsgData(nextMessage);
  //   setCharactersLeft(nextRemaining);
  //   setuserAddedgreetingCardMsgDataError(trimmedPreset.length < preset.length);
  //   setuserAddedgreetingCardNoMsgDataError(false);
  // }
  const setGreetingToTextarea = (preset = "") => {
    const current = userAddedgreetingCardMsgData || "";
  
    // Combine existing + preset
    let combined = current + preset;
  
    // HARD LIMIT (clamp to 500)
    if (combined.length > MAX_GREETING_CHAR) {
      combined = combined.slice(0, MAX_GREETING_CHAR);
    }
  
    const remaining = MAX_GREETING_CHAR - combined.length;
  
    setuserAddedgreetingCardMsgData(combined);
    setCharactersLeft(remaining);
  
    // Show error only when preset was trimmed
    setuserAddedgreetingCardMsgDataError(combined.length < current.length + preset.length);
    setuserAddedgreetingCardNoMsgDataError(false);
  };
  

  // FUNCTION TO SET THE USER ADDED MESSAGE IN A LOCAL VAR AS SOON THE USER TYPES A CHARACTER FOR LENGTH VALIDATION START
  // const setLiveMsgData = (value = "") => {
  //   const input = typeof value === "string" ? value : "";
  //   const sanitizedValue = input.slice(0, MAX_GREETING_CHAR);
  //   const remaining = MAX_GREETING_CHAR - sanitizedValue.length;
  //   const wasTrimmed = sanitizedValue.length !== input.length;
  //   const hitLimit = sanitizedValue.length >= MAX_GREETING_CHAR;

  //   setuserAddedgreetingCardMsgData(sanitizedValue);
  //   setCharactersLeft(remaining);
  //   setuserAddedgreetingCardMsgDataError(wasTrimmed || hitLimit);
  //   setuserAddedgreetingCardNoMsgDataError(false);
  // }
  const setLiveMsgData = (value = "") => {
    // Always sanitize value first
    let sanitized = value.slice(0, MAX_GREETING_CHAR);
  
    const remaining = MAX_GREETING_CHAR - sanitized.length;
  
    setuserAddedgreetingCardMsgData(sanitized);
    setCharactersLeft(remaining);
  
    // Show error when user actually hits the limit
    setuserAddedgreetingCardMsgDataError(sanitized.length >= MAX_GREETING_CHAR);
    setuserAddedgreetingCardNoMsgDataError(false);
  };
  
  // FUNCTION TO SET THE USER ADDED MESSAGE IN A LOCAL VAR AS SOON THE USER TYPES A CHARACTER FOR LENGTH VALIDATION END


  // FUNCTION TO GO BACK TO ALL CARDS SECTION INSIDE THE MODAL AND CLOSE THE SINGLE OPENED CARD START
  const backToAllCards = () => {
    if (singleGreetingCardStatus) {
      setsingleGreetingCardStatus(false);
      setModalView(selectedCategory ? 'cards' : 'categories');
    } else if (modalView === 'cards') {
      setSelectedCategory(null);
      setModalView('categories');
    }
    setCharactersLeft(0);
  }

  // FUNCTION TO close modal
  const modalClose = () => {
    ui.overlay.close('my-modal');
    // setModalOpen(false);
  }

  // FUNCTION TO SAVE THE GREETING MESSAGE TO THE CART/CHECKOUT ATTRIBUTES START
  const saveUserGreetingCardDataToAttribs = async (mode) => {
    if (mode == "save") {
      var grappIncludeCard = "Yes", grappCardMessage = userAddedgreetingCardMsgData, grappCardTitle = currentOpenedGreetingCardData[0], grappCardImgUrl = currentOpenedGreetingCardData[1], grappCardId = currentOpenedGreetingCardData[4];
      if (grappCardMessage.length == 0) {
        setuserAddedgreetingCardNoMsgDataError(true);
        return true;
      }
      else {
        setuserAddedgreetingCardNoMsgDataError(false)
        setgreetingSaveButLoadingStatus(true);
        setLoading(true);
      }
      modalClose();
    }
    else {
      var grappIncludeCard = "No", grappCardMessage = "NA", grappCardTitle = "NA", grappCardImgUrl = "NA", grappCardId = "NA";
      setgreetingRemoveButLoadingStatus(true);
    }
    setSpinner(true);
    await addOrChangeAttribs({ type: "updateAttribute", key: "Card Message", value: grappCardMessage });
    await addOrChangeAttribs({ type: "updateAttribute", key: "Card Title", value: grappCardTitle });
    await addOrChangeAttribs({ type: "updateAttribute", key: "Card Image URL", value: grappCardImgUrl });
    await addOrChangeAttribs({ type: "updateAttribute", key: "Card ID", value: grappCardId });
    var response = await addOrChangeAttribs({ type: "updateAttribute", key: "Include Greeting Card", value: grappIncludeCard, });
    console.log(response);

    if (response.type == 'success') {
      setLoading(false);
      setSpinner(false);
      // modalClose();
    };
    setgreetingSaveButLoadingStatus(false);
    setgreetingRemoveButLoadingStatus(false);
    modalClose();
    // ui.overlay.close();
  }
  // FUNCTION TO SAVE THE GREETING MESSAGE TO THE CART/CHECKOUT ATTRIBUTES END

  const [selectedGreetingCardData, setselectedGreetingCardData] = useState([]);
  const [apiCalled, setapiCalled] = useState(false);
  const [borderHover, setBorderHover] = useState(null); // STATE USED TO MANAGE HOVER EFFECT OF GREETING CARDS
  const [textBorderHover, setTextBorderHover] = useState(null); // STATE USED TO MANAGE HOVER EFFECT OF PRESET MESSAGE TEXTS

  const GreetingCardsModal = (callApi = false, cardId = "", cardMsg = "") => {
    var cardMsgLength = cardMsg.length;
    if (cardId != "" && cardId != "NA") {

      if (selectedGreetingCardData.length == 0 && apiCalled == false) {
        setCharactersLeft(500 - cardMsgLength);
        setapiCalled(true);
        fetch(`https://db-develop.com/api.php?action=fetchSingleCard&id=${cardId}`)
          .then((cardDataRaw) => cardDataRaw.json())
          .then((cardDataParsed) => {
            setselectedGreetingCardData(cardDataParsed);
            openUserSelectedGreetingCard([
              cardDataParsed[0].title,
              cardDataParsed[0].image_url,
              "1",
              cardDataParsed[0].presets,
              cardDataParsed[0].id
            ]);
            setuserAddedgreetingCardMsgData(cardMsg);
          });
      }
    }

    return (
      <>
        <Modal size="max" padding title="Select a Greeting Card" id="my-modal" onClose={handleGreetingCardModal}>
          {modalView === 'categories' && !singleGreetingCardStatus ?
            <ScrollView maxBlockSize={500} direction="block" padding="base">
              <Grid
                columns={Style.default(['auto'])
                  .when({ viewportInlineSize: { min: 'small' } }, ['auto', 'auto'])
                  .when({ viewportInlineSize: { min: 'medium' } }, ['auto', 'auto', 'auto'])}
                rows={['auto', 'auto']} spacing="small100"
              >
                {categoriesData?.map((cat, i) => (
                  <View inlinePadding="xtight" key={i} border={borderHover == i ? "dotted" : "base"} borderWidth="medium" inlineAlignment="center" borderRadius="base">
                    <Pressable cornerRadius="base" padding="base" onPress={() => { setSelectedCategory(cat); setModalView('cards'); }} onPointerEnter={() => setBorderHover(i)}
                      onPointerLeave={() => setBorderHover(null)}>
                      <BlockStack inlineAlignment="center">
                        <Text padding="base" size="medium" emphasis="strong" key={i}>
                          {cat.title}
                        </Text>
                      </BlockStack>
                      <BlockSpacer spacing="small100" />

                      <Image fit="contain" inlineSize="200" blockSize="140" source={cat.image != null || cat.image != undefined ? cat.image : 'https://fastly.picsum.photos/id/1033/200/300.jpg?hmac=856_WOyaGXSjI4FWe3_NCHU7frPtAEJaHnAJja5TMNk'} loading="lazy" />

                    </Pressable>
                  </View>
                ))}
              </Grid>
            </ScrollView>
            : modalView === 'cards' && selectedCategory && !singleGreetingCardStatus ?
              <ScrollView maxBlockSize={500} direction="block" padding="base">
                <InlineLayout columns={['auto', 'fill']}>
                  <View padding="base">
                    <Pressable accessibilityLabel="Back to categories" onPress={() => { setSelectedCategory(null); setModalView('categories'); }}>
                      <Icon source="arrowLeft" />
                    </Pressable>
                  </View>
                  <View padding="base" inlineAlignment="center">
                    <Heading level={2}>{selectedCategory?.title} Category Greeting Cards</Heading>
                  </View>
                </InlineLayout>
                <BlockSpacer spacing="base" />
                <Grid
                  columns={Style.default(['auto'])
                    .when({ viewportInlineSize: { min: 'small' } }, ['auto', 'auto'])
                    .when({ viewportInlineSize: { min: 'medium' } }, ['auto', 'auto', 'auto'])}
                  rows={['auto', 'auto']} spacing="base"
                >
                  {(selectedCategory.cards || allGreetingCardsData || []).map((data, i) => (
                    <View key={i} border={borderHover == i ? "dotted" : "base"} borderWidth="medium" inlineAlignment="center" borderRadius="base">
                      <Pressable cornerRadius="base" padding="base" onPress={() => { openUserSelectedGreetingCard(data); }} onPointerEnter={() => setBorderHover(i)}
                        onPointerLeave={() => setBorderHover(null)}>
                        <Image fit="contain" inlineSize="200" blockSize="140" source={data[1]} loading="lazy" />
                        <BlockSpacer spacing="small100" />
                        <BlockStack inlineAlignment="center">
                          <Text padding="base" size="medium" emphasis="strong" key={i}>
                            {data[0]}
                          </Text>
                        </BlockStack>
                      </Pressable>
                    </View>
                  ))}
                </Grid>
              </ScrollView>
              :
              <>
                <ScrollView maxBlockSize={450} direction="block" padding="base">
                  {/* <InlineLayout columns={["40%", "fill"]}> */}
                    <View padding="base" inlineAlignment="center">
                      <Image fit="contain" inlineSize="200" blockSize="160" source={currentOpenedGreetingCardData[1]} />
                    </View>
                    <View padding={"base"}>
                      {userAddedgreetingCardMsgDataError ? <Banner status="warning" title="Message Character Limit will be Exceeded." onDismiss={() => { setuserAddedgreetingCardMsgDataError(false) }} /> : null}
                      {userAddedgreetingCardNoMsgDataError ? <Banner status="critical" title="Message Field Cannot be Blank." onDismiss={() => { setuserAddedgreetingCardNoMsgDataError(false) }} /> : null}
                      <BlockSpacer spacing="small100" />
                      <TextField
                        label="Message"
                        multiline={3}
                        id="greetingMsgfield"
                        value={userAddedgreetingCardMsgData}
                        onInput={(value) => { setLiveMsgData(value); }}
                        maxLength={MAX_GREETING_CHAR}
                      />
                      <TextBlock inlineAlignment='end'>
                        {charactersLeft != undefined || charactersLeft != null ? charactersLeft : 500}/500
                      </TextBlock>

                      <BlockSpacer spacing="small100" />
                      {/* <View padding={"base"} inlineAlignment="center">
                      <Button kind="secondary" inlineAlignment="center" accessibilityRole="button">  </Button>
                    </View> */}
                      <View padding="base" inlineAlignment="center" border="base" background='subdued' cornerRadius='fullyRounded' >
                        <TextBlock inlineAlignment="center" appearance="accent">{currentOpenedGreetingCardData[0]}</TextBlock>
                      </View>
                      <BlockSpacer spacing="small100" />
                    </View>
                  {/* </InlineLayout> */}
                  <Banner
                    status="success"
                    title="Message Suggestions :"
                  />
                  <BlockLayout padding="base" spacing="small100">
                    {(() => {
                      const presetsRaw = currentOpenedGreetingCardData[3];
                      let presets = [];
                      if (Array.isArray(presetsRaw)) {
                        presets = presetsRaw;
                      } else if (typeof presetsRaw === 'string') {
                        try {
                          presets = JSON.parse(presetsRaw) || [];
                        } catch (e) {
                          presets = [];
                        }
                      }
                      return presets;
                    })()?.map((data, i) => (
                      <Pressable key={i} onPress={() => { setGreetingToTextarea(data); }} display="block" cornerRadius="base" border={textBorderHover == i ? "base" : "dotted"} onPointerEnter={() => setTextBorderHover(i)} onPointerLeave={() => setTextBorderHover(null)}>
                        <View padding="base" inlineAlignment="center"  >
                          <TextBlock inlineAlignment="center" appearance={textBorderHover == i ? "accent" : "base"}>{data}</TextBlock>
                        </View>
                      </Pressable>
                    ))}
                  </BlockLayout>
                </ScrollView>
                <InlineLayout border="['base', 'none']" columns={['40%', 'fill']}>
                  <View border="none" padding="base">
                    <Button onPress={() => saveUserGreetingCardDataToAttribs("remove")} kind="primary" appearance="critical" loading={greetingRemoveButLoadingStatus}>Remove</Button>
                    <InlineSpacer spacing="small100" />
                    <Button onPress={backToAllCards} kind="secondary" appearance="monochrome" padding={["none", "none", "none", "tight"]}>Back</Button>
                    <InlineSpacer spacing="small100" />
                  </View>
                  <View border="none" padding="base" inlineAlignment="end">
                    <Button onPress={() => saveUserGreetingCardDataToAttribs("save")} loading={greetingSaveButLoadingStatus} Appearance="monochrome" kind="primary">Add</Button>
                  </View>
                </InlineLayout>
              </>
          }
        </Modal>
      </>
    );
  }
  if (appStatus == 'on') {
    if (extension.target == "purchase.checkout.block.render") { // POINT WHERE THE CHECKBOX WILL BE RENDERED

      if (spinner) {
        return (
          <>
            Loading
            <Spinner />
          </>
        );
      } else {
        return (
          <>
            <InlineLayout columns={['8%', 'fill']}>
              <View>
                <Image source="https://cdn.shopify.com/s/files/1/0581/5065/0048/files/imgpsh_fullsize_anim.jpg?v=1664798477" />
              </View>
              <View>
                <TextBlock> Greeting Card Option</TextBlock>
              </View>
            </InlineLayout>
            <BlockSpacer spacing="large200" />
            <InlineLayout columns={['auto', 'fill']}>
              <View>
                Do you want to include a Greeting Card with your order?
              </View>
              <View padding={["none", "none", "none", "extraTight"]}>
                <Link overlay={GreetingCardsModal()}>
                  Click here
                </Link>
              </View>
            </InlineLayout>
            <TextBlock size="small">* Note: If you include a Greeting Card, we will treat this order as a gift and will only include a gift receipt with the order and then just email the copy of the invoice to you for your reference.</TextBlock>
          </>
        );
      }
    }
    else { // POINT WHERE THE EDIT GREETING TEXT WITLL BE HANDLE
      if (loading) {
        return <Text>Loading...</Text>;
      }
      var greetingCardAttribsObj = {
        "Include Greeting Card": "No",
        "Card Message": "",
        "Card Title": "",
        "Card Image URL": "",
        "Card ID": ""
      };
      for (var i = 0; i < currentCartAttribs.length; i++) {
        var greetingAttribKey = currentCartAttribs[i]['key'], greetingAttribVal = currentCartAttribs[i]['value'];
        greetingCardAttribsObj[greetingAttribKey] = greetingAttribVal;
      }
      return (
        <>
          {
            greetingCardAttribsObj["Include Greeting Card"] == "Yes" &&


            <>
              <BlockLayout rows={['fill']}>
                <View border="base" padding="base">
                  <Heading inlineAlignment="center">
                    <Text emphasis="bold" size="extraLarge"> Greeting Card Chosen</Text>
                  </Heading>
                </View>
              </BlockLayout>
              <InlineLayout columns={['30%', 'fill']} border="base">
                <View padding="base">
                  <Heading level={2}> {greetingCardAttribsObj["Card Title"]} </Heading>
                </View>
                <View padding="base">
                  {greetingCardAttribsObj["Card Message"]}
                  <BlockSpacer spacing="base" />
                  <TextBlock inlineAlignment="center">
                    <Link overlay={GreetingCardsModal(true, greetingCardAttribsObj["Card ID"], greetingCardAttribsObj["Card Message"])} onPress={() => { setselectedGreetingCardData([]); setapiCalled(false); setModalOpen(true) }}>
                      Edit Card/ Message
                    </Link>
                  </TextBlock>
                </View>
              </InlineLayout>
            </>
          }
        </>
      );
    }
  } else {
    return null;
  }
}
