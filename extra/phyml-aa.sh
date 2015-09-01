TEMPFILE=`mktemp`

cat > $TEMPFILE
phyml -i $TEMPFILE -d aa &> /dev/null

OUTPUT=$TEMPFILE"_phyml_tree.txt"

cat $OUTPUT

rm $OUTPUT
rm $TEMPFILE
