import {
    reactExtension,
    View,
    Heading,
    Text, 
    BlockLayout, 
    InlineLayout, 
    BlockSpacer, 
    useApi
  } from '@shopify/ui-extensions-react/checkout';
  import { useState, useEffect, useCallback } from "react";
  
  // Allow the attribution survey to display on the thank you page.
  const thankYouBlock = reactExtension("purchase.thank-you.block.render", () => <Attribution />);
  export { thankYouBlock };
  
  function Attribution() {
    const { orderConfirmation } = useApi();
    const fullOrderId = orderConfirmation.current.order.id;
    const orderId = fullOrderId.split('/').pop();
    const [noteDetail, setNoteDetail] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greetingCardAttribsObj, setGreetingCardAttribsObj] = useState({});
  
    const fetchNoteDetail = useCallback(() => {
      if (orderId) {
        fetch(`https://db-develop.com/ordernode.php?order_id=${orderId}&action=orderNode&dev=1`)
          .then((response) => response.json())
          .then((data) => {
            console.log(data, 'data');
            setNoteDetail(data);
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error fetching data:', error);
            setLoading(false);
          });
      }
    }, [orderId]);
  
    useEffect(() => {
      console.log('api useEffect');
      fetchNoteDetail();
    }, [fetchNoteDetail]);
  
    useEffect(() => {
      console.log('noteDetail useEffect');
      if (noteDetail.length > 0) {
        setGreetingCardAttribsObj(prevState => {
          const updatedGreetingCardAttribsObj = { ...prevState };
          noteDetail.forEach(detail => {
            const { name, value } = detail;
            if (name && value) {  // Ensure name and value are valid
              updatedGreetingCardAttribsObj[name] = value;
            }
          });
          return updatedGreetingCardAttribsObj;
        });
      }
    }, [noteDetail]);
  
    if (loading) {
      return <Text>Loading...</Text>;
    }
  
    if (!noteDetail.length) {
      return <Text>No greeting card details available.</Text>;
    }
  
    console.log(greetingCardAttribsObj, 'obj');
  
    return (
      <>
        {greetingCardAttribsObj["Include Greeting Card"] === "Yes" && (
          <>
            <BlockLayout rows={['fill']}>
              <View border="base" padding="base">
                <Heading inlineAlignment="center">
                  <Text emphasis="bold" size="extraLarge">Greeting Card Chosen</Text>
                </Heading>
              </View>
            </BlockLayout>
            <InlineLayout columns={['30%', 'fill']} border="base">
              <View padding="base">
                <Heading level={2}>{greetingCardAttribsObj["Card Title"]}</Heading>
              </View>
              <View padding="base">
                {greetingCardAttribsObj["Card Message"]}
                <BlockSpacer spacing="base" />
              </View>
            </InlineLayout>
          </>
        )}
      </>
    );
  }
  